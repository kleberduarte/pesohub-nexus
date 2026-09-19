"use client";

import { authApi } from "../../lib/api";
import DefinirSenhaPorLink from "../../components/auth/DefinirSenhaPorLink";

/**
 * Aceite de convite (card #91): o convidado escolhe a própria senha, e só ele
 * a conhece — nem quem criou a conta.
 */
export default function AceitarConvitePage() {
  return (
    <DefinirSenhaPorLink
      titulo="Bem-vindo ao PesoHub"
      descricao="Escolha a senha que você vai usar para entrar. Só você vai conhecê-la."
      semToken={{
        texto:
          "Este endereço não traz um convite válido. Abra o link direto do e-mail ou peça um novo convite ao administrador da sua empresa.",
      }}
      sucesso="Senha definida. Sua conta está pronta — entre com seu e-mail e a senha que acabou de escolher."
      enviar={authApi.aceitarConvite}
    />
  );
}
