import * as bcrypt from "bcrypt";
import {
  acrescentarAoHistorico,
  HISTORICO_SENHAS,
  reusaSenhaAnterior,
  senhaExpirada,
  validarComplexidade,
  VALIDADE_SENHA_DIAS,
} from "./password-policy";

describe("política de senha", () => {
  it("aceita uma senha que cumpre todas as regras", () => {
    expect(validarComplexidade("Bx7#quelca")).toEqual([]);
  });

  // A regra anterior era só @MinLength(6), que aceitava exatamente isto.
  it("recusa as senhas que a regra antiga deixava passar", () => {
    expect(validarComplexidade("123456").length).toBeGreaterThan(0);
    expect(validarComplexidade("senha1").length).toBeGreaterThan(0);
  });

  it("lista todas as regras que faltaram, não só a primeira", () => {
    const problemas = validarComplexidade("abc");
    expect(problemas.length).toBeGreaterThanOrEqual(4);
  });

  // "Senha@123" cumpre todos os critérios formais de composição e é
  // exatamente o que as pessoas escolhem quando obrigadas a criar uma senha.
  it("recusa sequências comuns mesmo quando a composição é válida", () => {
    expect(validarComplexidade("Senha@123")).toContainEqual(expect.stringMatching(/comum demais/i));
  });

  it("recusa senha derivada do próprio e-mail", () => {
    expect(validarComplexidade("Kleber@2026x", "kleber@ramuza.com.br")).toContainEqual(
      expect.stringMatching(/não pode conter o seu e-mail/i),
    );
  });

  it("detecta reuso de uma senha anterior", async () => {
    const anteriores = [await bcrypt.hash("Bx7#quelca", 4)];
    expect(await reusaSenhaAnterior("Bx7#quelca", anteriores)).toBe(true);
    expect(await reusaSenhaAnterior("Zk9$mirtal", anteriores)).toBe(false);
  });

  it("guarda apenas as últimas senhas, a mais nova primeiro", () => {
    const cheio = Array.from({ length: HISTORICO_SENHAS }, (_, i) => `hash-${i}`);
    const resultado = acrescentarAoHistorico(cheio, "hash-novo");
    expect(resultado).toHaveLength(HISTORICO_SENHAS);
    expect(resultado[0]).toBe("hash-novo");
    expect(resultado).not.toContain(`hash-${HISTORICO_SENHAS - 1}`);
  });

  it("expira a senha depois do prazo de validade", () => {
    const dia = 24 * 60 * 60 * 1000;
    expect(senhaExpirada(new Date(Date.now() - (VALIDADE_SENHA_DIAS + 1) * dia))).toBe(true);
    expect(senhaExpirada(new Date(Date.now() - 10 * dia))).toBe(false);
    // Conta que nunca trocou a senha não é barrada retroativamente: quem
    // decide isso é o mustChangePassword, não a ausência de data.
    expect(senhaExpirada(null)).toBe(false);
  });
});
