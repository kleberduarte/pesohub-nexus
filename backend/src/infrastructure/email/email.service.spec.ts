import { ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { EmailService, mascararEmail } from "./email.service";
import { escaparHtml, montarEmail } from "./email-layout";

function criarServico(env: Record<string, string>) {
  return new EmailService({ get: (k: string) => env[k] } as unknown as ConfigService);
}

const conteudo = { titulo: "Teste", paragrafos: ["Olá"] };

describe("montarEmail", () => {
  it("escapa texto digitado por clientes", () => {
    const { html } = montarEmail({ titulo: "<script>x</script>", paragrafos: ['Loja "A" & <b>B</b>'] });
    expect(html).not.toContain("<script>x</script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("Loja &quot;A&quot; &amp; &lt;b&gt;B&lt;/b&gt;");
  });

  it("descarta botão com URL que não é http(s)", () => {
    const { html, text } = montarEmail({ ...conteudo, acao: { rotulo: "Clique", url: "javascript:alert(1)" } });
    expect(html).not.toContain("javascript:");
    expect(text).not.toContain("javascript:");
  });

  it("inclui o link no HTML e na versão texto", () => {
    const { html, text } = montarEmail({ ...conteudo, acao: { rotulo: "Abrir", url: "https://app.pesohub.com.br/x?a=1&b=2" } });
    expect(html).toContain('href="https://app.pesohub.com.br/x?a=1&amp;b=2"');
    expect(text).toContain("Abrir: https://app.pesohub.com.br/x?a=1&b=2");
  });

  it("escaparHtml cobre os cinco caracteres", () => {
    expect(escaparHtml(`&<>"'`)).toBe("&amp;&lt;&gt;&quot;&#39;");
  });
});

describe("EmailService", () => {
  const fetchOriginal = global.fetch;
  afterEach(() => {
    global.fetch = fetchOriginal;
  });

  it("sem chave: falha alto e não chama a API", async () => {
    global.fetch = jest.fn();
    const servico = criarServico({});
    expect(servico.configurado).toBe(false);
    await expect(servico.enviar({ para: "a@b.com", assunto: "x", conteudo })).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("envia com Bearer e remetente configurado", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ id: "em_1" }) });
    const servico = criarServico({ RESEND_API_KEY: "re_x", EMAIL_FROM: "PesoHub <a@pesohub.com.br>" });

    await expect(servico.enviar({ para: "fulano@loja.com", assunto: "Oi", conteudo })).resolves.toEqual({ id: "em_1" });

    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect(init.headers.Authorization).toBe("Bearer re_x");
    const corpo = JSON.parse(init.body);
    expect(corpo).toMatchObject({ from: "PesoHub <a@pesohub.com.br>", to: ["fulano@loja.com"], subject: "Oi" });
    expect(corpo.html).toContain("PesoHub");
  });

  it("recusa do Resend vira exceção, não sucesso silencioso", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 403, text: async () => "domain not verified" });
    const servico = criarServico({ RESEND_API_KEY: "re_x" });
    await expect(servico.enviar({ para: "a@b.com", assunto: "x", conteudo })).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it("falha de rede vira exceção", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("ECONNRESET"));
    const servico = criarServico({ RESEND_API_KEY: "re_x" });
    await expect(servico.enviar({ para: "a@b.com", assunto: "x", conteudo })).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});

describe("mascararEmail", () => {
  it("esconde o usuário e mantém o domínio", () => {
    expect(mascararEmail("fulano@empresa.com")).toBe("fu***@empresa.com");
    expect(mascararEmail("invalido")).toBe("***");
  });
});
