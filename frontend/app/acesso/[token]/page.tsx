"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { authApi, clientesApi, getCurrentUser, ApiError, type ClienteBranding } from "../../../lib/api";
import { applyBranding, resetBranding } from "../../../lib/branding";
import LoginCard from "../../../components/auth/LoginCard";

export default function CompanyAccessPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;

  const [branding, setBranding] = useState<ClienteBranding | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    clientesApi
      .publicAccess(token)
      .then((data) => {
        setBranding(data);
        applyBranding(data);
      })
      .catch((err) => {
        setBranding(null);
        resetBranding();
        setError(err instanceof ApiError ? err.message : "Link de acesso inválido ou expirado.");
      })
      .finally(() => setLoading(false));

    return () => resetBranding();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100/80 p-4">
        <div className="rounded-[1.75rem] border border-slate-200/80 bg-white px-8 py-10 shadow-[0_20px_60px_-24px_rgba(15,23,42,0.18)]">
          <p className="text-sm text-slate-500">Carregando acesso da empresa...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100/80 p-4">
        <div className="w-full max-w-md rounded-[1.75rem] border border-slate-200/80 bg-white px-8 py-10 text-center shadow-[0_20px_60px_-24px_rgba(15,23,42,0.18)]">
          <p className="text-sm font-medium text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  const handleLoginSuccess = async () => {
    // Login sempre resolve a empresa a partir do usuário (fixa para ADMIN/OPERADOR,
    // ou a última empresa ativa persistida para SUPERADMIN — ver auth.service.ts).
    // Um SUPERADMIN entrando por este link específico da empresa quer, na prática,
    // ativar essa empresa — como o "trocar de empresa" faz, mas direto do login.
    const user = getCurrentUser();
    if (user?.role === "SUPERADMIN" && branding?.id) {
      try {
        await authApi.switchCompany(branding.id);
      } catch {
        // se falhar, mantém a empresa que o login normal já resolveu
      }
    }
  };

  return <LoginCard branding={branding} onLoginSuccess={handleLoginSuccess} />;
}
