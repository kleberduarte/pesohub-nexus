import { extrairDominio, validarDominioDeEmail } from "./email-domain-policy";

/**
 * Quem pode ser cadastrado com qual e-mail, e o que passa a enxergar (card #96).
 *
 * A Empresa (ex.: Ramuza) vende balança e sistema; os supermercados clientes
 * são Lojas dela. O funcionário do supermercado usa o e-mail do supermercado
 * (@davo.com.br), não o da Ramuza. Uma Loja pode declarar esse domínio, e as
 * Lojas com o mesmo domínio formam uma rede.
 *
 * A regra existe para um supermercado nunca enxergar outro: quem tem e-mail de
 * rede fica preso às lojas daquela rede, e nunca pode ser Administrador, que
 * vê a empresa inteira.
 */

export type PerfilUsuario = "SUPERADMIN" | "ADMIN" | "ADMIN_REDE" | "OPERADOR" | "VIEWER";

export interface LojaDaRede {
  id: string;
  dominioEmail: string | null;
}

export type AcessoPorDominio =
  /** E-mail da própria empresa: regras de sempre. */
  | { tipo: "empresa" }
  /** E-mail de rede: acesso às lojas listadas (a rede inteira, ou a loja escolhida). */
  | { tipo: "rede"; dominio: string; lojaIds: string[] }
  | { tipo: "recusado"; erro: string };

const PERFIS_DE_REDE: PerfilUsuario[] = ["ADMIN_REDE", "OPERADOR", "VIEWER"];

export function normalizarDominio(dominio: string | null | undefined): string | null {
  const d = dominio?.trim().toLowerCase().replace(/^@/, "");
  return d ? d : null;
}

export function decidirAcessoPorDominio(params: {
  email: string;
  role: PerfilUsuario;
  lojaId?: string | null;
  dominioEmpresa: string | null;
  nomeEmpresa: string;
  lojas: LojaDaRede[];
}): AcessoPorDominio {
  const { email, role, lojaId, dominioEmpresa, nomeEmpresa, lojas } = params;
  const dominio = extrairDominio(email);

  if (dominio && dominioEmpresa && dominio === normalizarDominio(dominioEmpresa)) {
    // Administrador da loja existe para o supermercado se administrar; a
    // equipe da empresa já tem o Administrador de verdade.
    if (role === "ADMIN_REDE") {
      return {
        tipo: "recusado",
        erro: `Administrador da loja é para funcionário do supermercado. Para @${dominio}, use Administrador.`,
      };
    }
    return { tipo: "empresa" };
  }

  const daRede = lojas.filter((l) => dominio && normalizarDominio(l.dominioEmail) === dominio);
  if (!dominio || daRede.length === 0) {
    const erroEmpresa = validarDominioDeEmail(email, dominioEmpresa, nomeEmpresa);
    return {
      tipo: "recusado",
      erro: dominioEmpresa
        ? `O e-mail precisa ser @${dominioEmpresa} ou do domínio de uma das lojas. Para usar @${dominio ?? "?"}, cadastre esse domínio na loja do supermercado.`
        : (erroEmpresa ?? "E-mail inválido."),
    };
  }

  if (!PERFIS_DE_REDE.includes(role)) {
    return {
      tipo: "recusado",
      erro: `Um e-mail @${dominio} é de funcionário de loja: pode ser Administrador da loja, Operador ou Visualizador — nunca Administrador da empresa.`,
    };
  }

  if (lojaId) {
    // Ele gerencia os usuários da rede toda; preso a uma unidade, enxergaria
    // menos do que administra.
    if (role === "ADMIN_REDE") {
      return { tipo: "recusado", erro: "Administrador da loja enxerga a rede inteira; não escolha uma unidade." };
    }
    if (!daRede.some((l) => l.id === lojaId)) {
      return { tipo: "recusado", erro: `Um e-mail @${dominio} só pode ter acesso às lojas com esse domínio.` };
    }
    return { tipo: "rede", dominio, lojaIds: [lojaId] };
  }

  return { tipo: "rede", dominio, lojaIds: daRede.map((l) => l.id) };
}

/** Nome do Perfil que reúne todas as lojas de uma rede. */
export function nomePerfilDaRede(dominio: string): string {
  return `Rede: ${dominio}`;
}

/**
 * Perfil de um funcionário de rede preso a uma só unidade. Separado do
 * "Loja: <nome>" da equipe da empresa: se a loja sair da rede, o acesso dos
 * funcionários da rede antiga é revogado sem tocar no da empresa.
 */
export function nomePerfilDaUnidade(dominio: string, nomeLoja: string): string {
  return `${nomePerfilDaRede(dominio)} · Loja: ${nomeLoja}`;
}

/** Perfis "Rede: ..." são geridos pelo sistema, nunca editados à mão. */
export function ehPerfilDeRede(nome: string): boolean {
  return nome.trim().toLowerCase().startsWith("rede:");
}
