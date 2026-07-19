"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { EntityCrudPanel } from "../../../components/cadastros/EntityCrudPanel";
import {
  codigosBarrasFormatoApi,
  formatosImpressaoApi,
  teclasAcessoRapidoApi,
  setoresApi,
} from "../../../lib/api";

const STEPS = [
  { key: "inicio", label: "O que fazer?" },
  { key: "etiqueta", label: "Formato de impressão e código de barras" },
  { key: "setor", label: "Setor" },
  { key: "plu", label: "Cadastro de PLU" },
  { key: "tecla", label: "Tecla de acesso rápido" },
  { key: "fim", label: "Concluído" },
] as const;

export default function AssistentePage() {
  const [step, setStep] = useState(0);
  const [firstConfig, setFirstConfig] = useState(true);

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-1">Assistente de Configuração</h2>
        <p className="text-sm text-slate-500">
          Configuração guiada da balança, seguindo a ordem do manual do usuário (§1.2): formato de
          impressão/código de barras, setor, PLU e tecla de acesso rápido.
        </p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto">
        {STEPS.map((s, i) => (
          <div key={s.key} className="flex items-center gap-2 shrink-0">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                i < step
                  ? "bg-brand-600 text-white"
                  : i === step
                    ? "bg-brand-100 text-brand-700 border-2 border-brand-600"
                    : "bg-slate-100 text-slate-400"
              }`}
            >
              {i < step ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            <span className={`text-xs whitespace-nowrap ${i === step ? "text-slate-800 font-medium" : "text-slate-400"}`}>
              {s.label}
            </span>
            {i < STEPS.length - 1 && <div className="w-6 h-px bg-slate-200" />}
          </div>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 min-h-[300px]">
        {step === 0 && (
          <div className="space-y-4 max-w-lg">
            <label className="flex items-start gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
              <input
                type="radio"
                checked={firstConfig}
                onChange={() => setFirstConfig(true)}
                className="mt-1"
              />
              <div>
                <p className="font-medium text-slate-800 text-sm">Primeira configuração ou alteração de configuração</p>
                <p className="text-xs text-slate-500">
                  Passa pelas etapas de formato de impressão, código de barras, setor, PLU e tecla de acesso
                  rápido.
                </p>
              </div>
            </label>
            <label className="flex items-start gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
              <input
                type="radio"
                checked={!firstConfig}
                onChange={() => setFirstConfig(false)}
                className="mt-1"
              />
              <div>
                <p className="font-medium text-slate-800 text-sm">Editar apenas parâmetros específicos (SPEC)</p>
                <p className="text-xs text-slate-500">Pula direto para a tela de Especificações (SPEC).</p>
              </div>
            </label>
          </div>
        )}

        {step === 1 && firstConfig && (
          <div className="space-y-6">
            <EntityCrudPanel
              title="Formato de Impressão"
              csv={false}
              emptyForm={{ numero: 0, nome: "", tipo: 1, larguraMm: 56, alturaMm: 90 }}
              fields={[
                { key: "numero", label: "Número", type: "number", required: true },
                { key: "nome", label: "Nome", type: "text", required: true },
                { key: "larguraMm", label: "Largura (mm)", type: "number", required: true },
                { key: "alturaMm", label: "Altura (mm)", type: "number", required: true },
              ]}
              columns={[
                { key: "numero", label: "Número" },
                { key: "nome", label: "Nome" },
              ]}
              list={formatosImpressaoApi.list}
              create={formatosImpressaoApi.create}
              update={formatosImpressaoApi.update}
              remove={formatosImpressaoApi.remove}
            />
            <EntityCrudPanel
              title="Código de Barras"
              csv={false}
              emptyForm={{ numero: 14, nome: "", tipo: "EAN13", verificador: 0 }}
              fields={[
                { key: "numero", label: "Número (14~29)", type: "number", required: true },
                { key: "nome", label: "Nome", type: "text", required: true },
                {
                  key: "tipo",
                  label: "Tipo",
                  type: "select",
                  required: true,
                  options: [
                    { value: "EAN13", label: "EAN13" },
                    { value: "EAN128", label: "EAN-128" },
                  ],
                },
              ]}
              columns={[
                { key: "numero", label: "Número" },
                { key: "nome", label: "Nome" },
              ]}
              list={codigosBarrasFormatoApi.list}
              create={codigosBarrasFormatoApi.create}
              update={codigosBarrasFormatoApi.update}
              remove={codigosBarrasFormatoApi.remove}
            />
          </div>
        )}

        {step === 2 && firstConfig && (
          <EntityCrudPanel
            title="Setor"
            csv={false}
            emptyForm={{ numero: 0, nome: "" }}
            fields={[
              { key: "numero", label: "Número", type: "number", required: true },
              { key: "nome", label: "Nome", type: "text", required: true },
            ]}
            columns={[
              { key: "numero", label: "Número" },
              { key: "nome", label: "Nome" },
            ]}
            list={setoresApi.list}
            create={setoresApi.create}
            update={setoresApi.update}
            remove={setoresApi.remove}
          />
        )}

        {step === 3 && firstConfig && (
          <div className="text-center py-8 space-y-3">
            <p className="text-sm text-slate-600">
              Cadastre os produtos (PLU) na tela dedicada de Produtos, já vinculando o setor, formato de
              impressão e código de barras configurados nas etapas anteriores.
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium"
            >
              Ir para Produtos (PLU)
            </Link>
          </div>
        )}

        {step === 4 && firstConfig && (
          <EntityCrudPanel
            title="Tecla de Acesso Rápido"
            csv={false}
            emptyMessage="Nenhum modelo de teclado cadastrado."
            emptyForm={{ nome: "", modelo: "Atena II", pagina: "Modo de uma página" }}
            fields={[
              { key: "nome", label: "Nome do modelo", type: "text", required: true },
              {
                key: "modelo",
                label: "Modelo",
                type: "select",
                required: true,
                options: [
                  { value: "Atena II", label: "Atena II" },
                  { value: "Atena II sem torre", label: "Atena II sem torre" },
                ],
              },
              {
                key: "pagina",
                label: "Página",
                type: "select",
                required: true,
                options: [
                  { value: "Modo de uma página", label: "Modo de uma página (63 teclas)" },
                  { value: "Modo de duas páginas", label: "Modo de duas páginas (126 teclas)" },
                  { value: "Modo de três páginas", label: "Modo de três páginas (189 teclas)" },
                ],
              },
            ]}
            columns={[
              { key: "nome", label: "Nome" },
              { key: "modelo", label: "Modelo" },
            ]}
            list={teclasAcessoRapidoApi.list}
            create={teclasAcessoRapidoApi.create}
            update={teclasAcessoRapidoApi.update}
            remove={teclasAcessoRapidoApi.remove}
          />
        )}

        {(step === STEPS.length - 1 || (!firstConfig && step >= 1)) && (
          <div className="text-center py-8 space-y-4">
            <p className="text-sm text-slate-600">
              {firstConfig
                ? "Configuração concluída. Vá para Sincronização para enviar os dados para a balança."
                : "Acesse a tela de Especificações (SPEC) para ajustar parâmetros avançados."}
            </p>
            <Link
              href={firstConfig ? "/sync" : "/spec"}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium"
            >
              {firstConfig ? "Ir para Sincronização" : "Ir para SPEC"}
            </Link>
          </div>
        )}
      </div>

      <div className="flex justify-between mt-6">
        <button
          onClick={prev}
          disabled={step === 0}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium disabled:opacity-40"
        >
          <ChevronLeft className="w-4 h-4" /> Anterior
        </button>
        <button
          onClick={next}
          disabled={step >= (firstConfig ? STEPS.length - 1 : 1)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium disabled:opacity-40"
        >
          Próximo <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
