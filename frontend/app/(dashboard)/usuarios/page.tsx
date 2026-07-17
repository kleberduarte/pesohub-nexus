"use client";

import { useEffect, useState } from "react";
import { usersApi, ApiError, type AppUser } from "../../../lib/api";

export default function UsuariosPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    usersApi
      .list()
      .then(setUsers)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Não foi possível carregar os usuários."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-800">Usuários cadastrados</h2>
        <p className="text-sm text-slate-500">Usuários vinculados à empresa atualmente selecionada.</p>
      </div>

      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg">{error}</div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-6 py-4 font-medium">E-mail</th>
                <th className="px-6 py-4 font-medium">Perfil</th>
                <th className="px-6 py-4 font-medium">Criado em</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-slate-500">
                    Carregando usuários...
                  </td>
                </tr>
              )}
              {!loading &&
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-800">{user.email}</td>
                    <td className="px-6 py-4 text-slate-500">{user.role}</td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(user.createdAt).toLocaleDateString("pt-BR")}
                    </td>
                  </tr>
                ))}
              {!loading && users.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-slate-500">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
