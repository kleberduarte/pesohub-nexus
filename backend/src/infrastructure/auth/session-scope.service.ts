import { Injectable } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";

/**
 * Nomes dos cabeçalhos que carregam o escopo da aba.
 *
 * Por que cabeçalho e não cookie: cookie é por *navegador*. Enquanto a loja
 * ativa viajava no cookie, trocar de loja numa aba mudava a loja de todas as
 * outras — e o efeito prático era cadastrar produto numa aba e sincronizar
 * para a balança da loja que a outra aba tinha selecionado. Cabeçalho lido de
 * `sessionStorage` é por aba de verdade.
 */
export const HEADER_LOJA = "x-pesohub-loja";
export const HEADER_CLIENTE = "x-pesohub-cliente";

export interface EscopoUsuario {
  sub: string;
  role: string;
  clienteId: string | null;
  lojaId: string | null;
  perfilId?: string | null;
  scoped?: boolean;
}

/**
 * Resolve o escopo (empresa/loja) de uma requisição.
 *
 * O cabeçalho vem do navegador e portanto é entrada não confiável: um usuário
 * poderia mandar o id da loja de outra empresa. Tudo aqui é revalidado contra
 * o banco a cada requisição — o cabeçalho só escolhe entre o que a conta já
 * tem direito de ver, nunca amplia permissão.
 */
@Injectable()
export class SessionScopeService {
  constructor(private readonly prisma: PrismaService) {}

  async resolver(
    user: EscopoUsuario,
    headers: Record<string, unknown>,
  ): Promise<{ clienteId: string | null; lojaId: string | null }> {
    let clienteId = user.clienteId;
    let lojaId = user.lojaId;

    const clientePedido = primeiroValor(headers[HEADER_CLIENTE]);
    // Trocar de empresa é exclusivo do SUPERADMIN "global"; um SUPERADMIN
    // vinculado a uma empresa por domínio (scoped) fica travado nela.
    if (clientePedido && clientePedido !== clienteId && user.role === "SUPERADMIN" && !user.scoped) {
      const cliente = await this.prisma.cliente.findUnique({ where: { id: clientePedido } });
      if (cliente) {
        clienteId = cliente.id;
        // A loja do token pertence à empresa antiga; ao trocar de empresa ela
        // deixa de valer e precisa ser re-resolvida abaixo.
        lojaId = null;
      }
    }

    const lojaPedida = primeiroValor(headers[HEADER_LOJA]);
    if (lojaPedida && lojaPedida !== lojaId && clienteId) {
      if (await this.podeAcessarLoja(user, clienteId, lojaPedida)) {
        lojaId = lojaPedida;
      }
    }

    // Trocou de empresa e ficou sem loja: cai na primeira permitida, para a
    // requisição não seguir com escopo pela metade.
    if (clienteId && !lojaId) {
      lojaId = await this.primeiraLojaPermitida(clienteId, user.perfilId ?? null);
    }

    return { clienteId, lojaId };
  }

  /**
   * ADMIN/SUPERADMIN sem Perfil enxergam todas as lojas da empresa. Com Perfil,
   * só as lojas daquele Perfil (ver PerfilLojaAcesso).
   */
  async podeAcessarLoja(user: EscopoUsuario, clienteId: string, lojaId: string): Promise<boolean> {
    const loja = await this.prisma.loja.findFirst({ where: { id: lojaId, clienteId } });
    if (!loja) return false;

    if (user.role === "SUPERADMIN" || user.role === "ADMIN") return true;

    const dono = await this.prisma.user.findUnique({ where: { id: user.sub } });
    if (!dono?.perfilId) return true;
    const acesso = await this.prisma.perfilLojaAcesso.findFirst({
      where: { perfilId: dono.perfilId, lojaId },
    });
    return !!acesso;
  }

  async primeiraLojaPermitida(clienteId: string, perfilId: string | null): Promise<string | null> {
    const where = perfilId ? { clienteId, perfilAcessos: { some: { perfilId } } } : { clienteId };
    const loja = await this.prisma.loja.findFirst({ where, orderBy: { createdAt: "asc" } });
    return loja?.id ?? null;
  }
}

function primeiroValor(valor: unknown): string | null {
  if (Array.isArray(valor)) return typeof valor[0] === "string" ? valor[0] : null;
  return typeof valor === "string" && valor.length > 0 ? valor : null;
}
