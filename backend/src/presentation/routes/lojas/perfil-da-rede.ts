import { PrismaService } from "../../../infrastructure/database/prisma.service";
import { nomePerfilDaRede, nomePerfilDaUnidade, normalizarDominio } from "../../../domain/services/acesso-por-dominio";

/**
 * Mantém o Perfil "Rede: <domínio>" com exatamente as lojas daquele domínio
 * (card #96). É o que faz uma unidade nova do supermercado aparecer para os
 * funcionários da rede sem ninguém mexer nos usuários, e uma loja que troca de
 * domínio sair do acesso da rede antiga na hora.
 *
 * O escopo de acesso já vem inteiro do Perfil (PerfilLojaAcesso), que o login,
 * a troca de loja e as listagens respeitam — aqui só se mantém a lista certa.
 *
 * @returns id do Perfil da rede, ou null se o domínio não tem mais loja (o
 * perfil fica vazio: quem o tem não enxerga nada, que é o seguro).
 */
export async function sincronizarPerfilDaRede(
  prisma: PrismaService,
  clienteId: string,
  dominioBruto: string | null | undefined,
): Promise<string | null> {
  const dominio = normalizarDominio(dominioBruto);
  if (!dominio) return null;

  const lojas = await prisma.loja.findMany({
    where: { clienteId, dominioEmail: dominio },
    select: { id: true },
  });
  const perfil = await prisma.perfil.upsert({
    where: { clienteId_nome: { clienteId, nome: nomePerfilDaRede(dominio) } },
    update: {},
    create: { clienteId, nome: nomePerfilDaRede(dominio) },
  });

  await prisma.$transaction([
    prisma.perfilLojaAcesso.deleteMany({
      where: { perfilId: perfil.id, lojaId: { notIn: lojas.map((l) => l.id) } },
    }),
    prisma.perfilLojaAcesso.createMany({
      data: lojas.map((l) => ({ perfilId: perfil.id, lojaId: l.id })),
      skipDuplicates: true,
    }),
  ]);
  return lojas.length > 0 ? perfil.id : null;
}

/**
 * Loja que saiu de uma rede: tira ela dos perfis de unidade daquela rede, para
 * o funcionário preso só a ela não seguir enxergando a loja de outro dono.
 */
export async function revogarUnidadeDaRede(
  prisma: PrismaService,
  clienteId: string,
  dominioAntigo: string | null | undefined,
  lojaId: string,
): Promise<void> {
  const dominio = normalizarDominio(dominioAntigo);
  if (!dominio) return;
  await prisma.perfilLojaAcesso.deleteMany({
    where: { lojaId, perfil: { clienteId, nome: { startsWith: nomePerfilDaUnidade(dominio, "") } } },
  });
}
