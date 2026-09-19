"use client";

import { authApi } from "../../lib/api";
import DefinirSenhaPorLink from "../../components/auth/DefinirSenhaPorLink";

/**
 * Nova senha a partir do link do e-mail (card #90). O token é de uso único;
 * depois de usado, a sessão antiga (se houver) é encerrada e a pessoa entra
 * de novo com a senha nova.
 */
export default function RedefinirSenhaPage() {
  return (
    <DefinirSenhaPorLink
      titulo="Escolha uma nova senha"
      semToken={{
        texto: "Este endereço não traz um link de redefinição válido. Abra o link direto do e-mail, ou peça um novo.",
        linkRotulo: "Pedir novo link",
        linkHref: "/esqueci-senha",
      }}
      sucesso="Senha redefinida. Entre com a nova senha."
      enviar={authApi.redefinirSenha}
    />
  );
}
