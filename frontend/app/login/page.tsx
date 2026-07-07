"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { login, setToken, ApiError } from "../../lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("admin@ramuza.com.br");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { accessToken } = await login(email, password);
      setToken(accessToken);
      router.push("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível conectar à API. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <div className="mb-8 flex flex-col items-center">
        <svg className="w-16 h-16 mb-2" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M50 15 L90 85 L70 85 L50 50 L30 85 L10 85 Z" fill="#E30613" />
        </svg>
        <span className="text-3xl font-bold tracking-tight text-slate-800">ramuza</span>
      </div>

      {/* Login Card */}
      <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] w-full max-w-md p-8 border border-slate-100">
        <h2 className="text-2xl font-bold text-slate-900 mb-8">Acessar o sistema</h2>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg">
              {error}
            </div>
          )}

          {/* Email Input */}
          <div className="relative">
            <label className="absolute -top-2.5 left-3 bg-white px-1 text-sm font-medium text-slate-500 z-10">
              E-mail
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-4 text-slate-400">
                <Mail className="w-5 h-5" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all bg-transparent"
                placeholder=" "
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="relative">
            <label className="absolute -top-2.5 left-3 bg-white px-1 text-sm font-medium text-slate-500 z-10">
              Senha
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-4 text-slate-400">
                <Lock className="w-5 h-5" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-12 py-3.5 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all bg-transparent"
                placeholder=" "
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl shadow-[0_4px_14px_rgba(227,6,19,0.25)] hover:shadow-[0_6px_20px_rgba(227,6,19,0.3)] transition-all duration-200 mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
