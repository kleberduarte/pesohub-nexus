/**
 * Regra de domínio de e-mail por empresa (card #48).
 *
 * O critério é o mesmo que já valia para o SUPERADMIN, agora estendido a todos
 * os perfis: a conta de uma pessoa tem que viver no domínio da empresa dela.
 * SUPERADMIN em `@pesohub.com.br`, gente da Ramuza em `@ramuza.com.br`.
 *
 * Por que isso é controle de acesso e não burocracia: o domínio é o que
 * amarra a conta a uma organização que pode revogá-la. Uma conta em
 * `@gmail.com` continua funcionando depois que a pessoa sai da empresa, e não
 * há como a Ramuza desativá-la — a trilha de auditoria passa a apontar para
 * alguém que ninguém controla mais.
 */

export function extrairDominio(email: string): string | null {
  const dominio = email.split("@")[1]?.trim().toLowerCase();
  return dominio && dominio.length > 0 ? dominio : null;
}

export function emailPertenceAoDominio(email: string, dominio: string): boolean {
  return extrairDominio(email) === dominio.trim().toLowerCase();
}

/**
 * @returns mensagem de erro, ou null se o e-mail é aceitável.
 *
 * @param dominioDaEmpresa `null` quando a empresa ainda não configurou um
 * domínio. Nesse caso a regra não tem como ser aplicada, e recusar é o certo:
 * deixar passar criaria contas fora de qualquer domínio justamente enquanto a
 * empresa está sendo configurada, que é quando quase todas as contas nascem.
 */
export function validarDominioDeEmail(
  email: string,
  dominioDaEmpresa: string | null,
  nomeDaEmpresa: string,
): string | null {
  if (!dominioDaEmpresa) {
    return `A empresa ${nomeDaEmpresa} ainda não tem um domínio de e-mail configurado. Defina o domínio da empresa antes de cadastrar usuários.`;
  }

  if (!emailPertenceAoDominio(email, dominioDaEmpresa)) {
    return `Usuários de ${nomeDaEmpresa} precisam usar um e-mail @${dominioDaEmpresa}.`;
  }

  return null;
}
