"use client";

import { useEffect, useState } from "react";
import { clientesApi, getActiveClienteToken, type ClienteBranding } from "../../lib/api";
import { applyBranding, resetBranding } from "../../lib/branding";
import LoginCard from "../../components/auth/LoginCard";

export default function LoginPage() {
  const [branding, setBranding] = useState<ClienteBranding | null>(null);

  useEffect(() => {
    // Após logout não há mais JWT, então /clientes/me/branding (que exige
    // sessão) não pode ser usado aqui. A empresa ativa é lembrada à parte
    // via accessToken público, para a tela de login continuar com a
    // identidade da última empresa selecionada.
    const activeToken = getActiveClienteToken();
    const request = activeToken ? clientesApi.publicAccess(activeToken) : clientesApi.branding();

    request
      .then((data) => {
        setBranding(data);
        applyBranding(data);
      })
      .catch(() => {
        // sem empresa ativa resolvida — mantém identidade padrão PesoHub
        setBranding(null);
        resetBranding();
      });
  }, []);

  return <LoginCard branding={branding} />;
}
