/**
 * Envia um e-mail de teste pelo Resend — critério de aceite do card #89.
 *
 * Usa o mesmo EmailService do backend, então valida a chave, o remetente e a
 * verificação do domínio exatamente como a aplicação vai usar.
 *
 *   npx ts-node scripts/enviar-email-teste.ts voce@exemplo.com
 *
 * Lê RESEND_API_KEY e EMAIL_FROM do ambiente ou do backend/.env.
 */
import { ConfigService } from "@nestjs/config";
import { EmailService } from "../src/infrastructure/email/email.service";

async function main() {
  try {
    process.loadEnvFile(".env");
  } catch {
    // sem .env: usa só o ambiente
  }

  const para = process.argv[2];
  if (!para || !para.includes("@")) {
    console.error("Uso: npx ts-node scripts/enviar-email-teste.ts <destinatario@exemplo.com>");
    process.exit(1);
  }

  const email = new EmailService(new ConfigService());
  const { id } = await email.enviar({
    para,
    assunto: "PesoHub — e-mail de teste",
    conteudo: {
      titulo: "O envio de e-mail está funcionando",
      paragrafos: ["Se você recebeu esta mensagem, o PesoHub já consegue enviar e-mails."],
      observacao: `Enviado em ${new Date().toLocaleString("pt-BR")}.`,
    },
  });
  console.log(`Enviado. id no Resend: ${id}`);
}

main().catch((err) => {
  console.error(`Falhou: ${err.message}`);
  process.exit(1);
});
