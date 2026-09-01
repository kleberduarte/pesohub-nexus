import { emailPertenceAoDominio, extrairDominio, validarDominioDeEmail } from "./email-domain-policy";

describe("política de domínio de e-mail", () => {
  it("aceita e-mail do domínio da empresa", () => {
    expect(validarDominioDeEmail("joao@ramuza.com.br", "ramuza.com.br", "Ramuza")).toBeNull();
  });

  it("recusa e-mail de fora do domínio", () => {
    expect(validarDominioDeEmail("joao@gmail.com", "ramuza.com.br", "Ramuza")).toMatch(/@ramuza\.com\.br/);
  });

  it("não diferencia maiúsculas de minúsculas", () => {
    expect(validarDominioDeEmail("Joao@Ramuza.COM.BR", "ramuza.com.br", "Ramuza")).toBeNull();
  });

  // Deixar passar aqui criaria contas fora de qualquer domínio justamente
  // durante a configuração da empresa, que é quando quase todas nascem.
  it("recusa quando a empresa ainda não tem domínio configurado", () => {
    expect(validarDominioDeEmail("joao@ramuza.com.br", null, "Ramuza")).toMatch(/não tem um domínio/i);
  });

  // Um subdomínio é outra organização: quem controla loja.ramuza.com.br não é
  // necessariamente quem controla ramuza.com.br.
  it("não aceita subdomínio como se fosse o domínio da empresa", () => {
    expect(emailPertenceAoDominio("joao@fake.ramuza.com.br", "ramuza.com.br")).toBe(false);
  });

  it("não se deixa enganar por domínio que apenas termina igual", () => {
    expect(emailPertenceAoDominio("joao@naoeramuza.com.br", "ramuza.com.br")).toBe(false);
  });

  it("lida com e-mail malformado sem quebrar", () => {
    expect(extrairDominio("sem-arroba")).toBeNull();
    expect(emailPertenceAoDominio("sem-arroba", "ramuza.com.br")).toBe(false);
  });
});
