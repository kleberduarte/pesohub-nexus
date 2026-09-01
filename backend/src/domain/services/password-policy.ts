import * as bcrypt from "bcrypt";

/**
 * Política de senha no padrão bancário (card #48).
 *
 * Até então a única regra era `@MinLength(6)`, o que aceitava "123456".
 */

/** Quantas senhas anteriores ficam vedadas para reuso. */
export const HISTORICO_SENHAS = 5;

/** Idade máxima da senha antes da troca obrigatória. */
export const VALIDADE_SENHA_DIAS = 90;

export const REGRAS_SENHA = [
  "pelo menos 8 caracteres",
  "uma letra maiúscula",
  "uma letra minúscula",
  "um número",
  "um caractere especial",
];

/**
 * Sequências óbvias que passariam nas regras de composição mas caem em
 * qualquer ataque de dicionário. "Senha@123" atende a todos os critérios
 * formais e é exatamente o que as pessoas escolhem.
 */
const SENHAS_PROIBIDAS = [
  "senha",
  "password",
  "123456",
  "abcdef",
  "qwerty",
  "admin",
  "pesohub",
  "ramuza",
];

/**
 * @returns lista de problemas; vazia significa senha aceita.
 */
export function validarComplexidade(senha: string, email?: string): string[] {
  const problemas: string[] = [];

  if (senha.length < 8) problemas.push("A senha precisa ter pelo menos 8 caracteres.");
  if (!/[A-Z]/.test(senha)) problemas.push("A senha precisa ter pelo menos uma letra maiúscula.");
  if (!/[a-z]/.test(senha)) problemas.push("A senha precisa ter pelo menos uma letra minúscula.");
  if (!/[0-9]/.test(senha)) problemas.push("A senha precisa ter pelo menos um número.");
  if (!/[^A-Za-z0-9]/.test(senha)) {
    problemas.push("A senha precisa ter pelo menos um caractere especial.");
  }

  const normalizada = senha.toLowerCase();
  if (SENHAS_PROIBIDAS.some((proibida) => normalizada.includes(proibida))) {
    problemas.push("A senha contém uma sequência comum demais. Escolha algo menos previsível.");
  }

  // O trecho antes do @ costuma ser o nome da pessoa — senha derivada do
  // próprio login não protege nada.
  const usuario = email?.split("@")[0]?.toLowerCase();
  if (usuario && usuario.length >= 3 && normalizada.includes(usuario)) {
    problemas.push("A senha não pode conter o seu e-mail.");
  }

  return problemas;
}

/** True se a senha bate com alguma das anteriores. */
export async function reusaSenhaAnterior(senha: string, anteriores: string[]): Promise<boolean> {
  for (const hash of anteriores) {
    if (await bcrypt.compare(senha, hash)) return true;
  }
  return false;
}

/** Mantém apenas as últimas `HISTORICO_SENHAS` entradas, a mais nova primeiro. */
export function acrescentarAoHistorico(anteriores: string[], hashAtual: string): string[] {
  return [hashAtual, ...anteriores].slice(0, HISTORICO_SENHAS);
}

export function senhaExpirada(passwordChangedAt: Date | null): boolean {
  if (!passwordChangedAt) return false;
  const idadeDias = (Date.now() - passwordChangedAt.getTime()) / (1000 * 60 * 60 * 24);
  return idadeDias > VALIDADE_SENHA_DIAS;
}
