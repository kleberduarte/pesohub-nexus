/**
 * Moldura comum dos e-mails do PesoHub (card #89).
 *
 * HTML de e-mail não é HTML de navegador: sem CSS externo, sem flex/grid, tudo
 * inline e em tabela — é o que Gmail e Outlook renderizam igual. Por isso a
 * moldura é uma função pura e não um template engine: os e-mails são poucos e
 * curtos, e uma dependência a mais não compra nada.
 *
 * Todo texto variável passa por `escaparHtml`. Nome de usuário e de empresa são
 * digitados por clientes; sem escape, viram injeção de HTML no e-mail de outro.
 */

const COR_MARCA = "#004080";

export function escaparHtml(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export interface ConteudoEmail {
  /** Título grande no topo do corpo. Texto puro — é escapado aqui. */
  titulo: string;
  /** Parágrafos do corpo. Texto puro — cada um é escapado aqui. */
  paragrafos: string[];
  /** Botão de ação opcional. A URL precisa ser http(s); qualquer outra é descartada. */
  acao?: { rotulo: string; url: string };
  /** Linha pequena depois do botão (ex.: "o link expira em 1 hora"). */
  observacao?: string;
}

function urlSegura(url: string): string | null {
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
}

export function montarEmail(conteudo: ConteudoEmail): { html: string; text: string } {
  const url = conteudo.acao ? urlSegura(conteudo.acao.url) : null;

  const paragrafosHtml = conteudo.paragrafos
    .map((p) => `<p style="margin:0 0 16px;font-size:15px;line-height:1.5;color:#334155">${escaparHtml(p)}</p>`)
    .join("");

  const botaoHtml =
    conteudo.acao && url
      ? `<p style="margin:24px 0"><a href="${escaparHtml(url)}" style="display:inline-block;background:${COR_MARCA};color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 24px;border-radius:8px">${escaparHtml(conteudo.acao.rotulo)}</a></p>` +
        `<p style="margin:0 0 16px;font-size:13px;color:#64748b">Se o botão não funcionar, copie este endereço no navegador:<br><span style="word-break:break-all">${escaparHtml(url)}</span></p>`
      : "";

  const observacaoHtml = conteudo.observacao
    ? `<p style="margin:0;font-size:13px;color:#64748b">${escaparHtml(conteudo.observacao)}</p>`
    : "";

  const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escaparHtml(conteudo.titulo)}</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden">
<tr><td style="background:${COR_MARCA};padding:20px 32px;color:#ffffff;font-size:20px;font-weight:700">PesoHub</td></tr>
<tr><td style="padding:32px">
<h1 style="margin:0 0 20px;font-size:20px;color:#0f172a">${escaparHtml(conteudo.titulo)}</h1>
${paragrafosHtml}${botaoHtml}${observacaoHtml}
</td></tr>
<tr><td style="padding:16px 32px;border-top:1px solid #e2e8f0;font-size:12px;color:#94a3b8">E-mail automático do PesoHub. Não responda esta mensagem.</td></tr>
</table></td></tr></table></body></html>`;

  const text = [
    conteudo.titulo,
    "",
    ...conteudo.paragrafos.flatMap((p) => [p, ""]),
    ...(conteudo.acao && url ? [`${conteudo.acao.rotulo}: ${url}`, ""] : []),
    ...(conteudo.observacao ? [conteudo.observacao, ""] : []),
    "—",
    "E-mail automático do PesoHub. Não responda esta mensagem.",
  ].join("\n");

  return { html, text };
}
