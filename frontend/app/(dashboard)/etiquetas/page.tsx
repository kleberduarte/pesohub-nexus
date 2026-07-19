"use client";

import { useState } from "react";
import { EntityCrudPanel } from "../../../components/cadastros/EntityCrudPanel";
import {
  codigosBarrasFormatoApi,
  formatosImpressaoApi,
  teclasAcessoRapidoApi,
  textosGlobaisApi,
} from "../../../lib/api";

const TABS = [
  { key: "formato", label: "Formato de Impressão" },
  { key: "codigo", label: "Código de Barras" },
  { key: "texto", label: "Texto Global" },
  { key: "tecla", label: "Tecla de Acesso Rápido" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function EtiquetasPage() {
  const [tab, setTab] = useState<TabKey>("formato");

  return (
    <div>
      <div className="flex gap-1 mb-6 border-b border-slate-200 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
              tab === t.key
                ? "border-brand-600 text-brand-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "formato" && (
        <EntityCrudPanel
          title="Formato de Impressão"
          emptyMessage="Nenhum formato de etiqueta cadastrado."
          emptyForm={{ numero: 0, nome: "", tipo: 1, larguraMm: 56, alturaMm: 90 }}
          fields={[
            { key: "numero", label: "Número", type: "number", required: true },
            { key: "nome", label: "Nome", type: "text", required: true },
            {
              key: "tipo",
              label: "Tipo",
              type: "select",
              options: [
                { value: "1", label: "Etiqueta" },
                { value: "0", label: "Relatório" },
              ],
            },
            { key: "larguraMm", label: "Largura (mm)", type: "number", required: true },
            { key: "alturaMm", label: "Altura (mm)", type: "number", required: true },
          ]}
          columns={[
            { key: "numero", label: "Número" },
            { key: "nome", label: "Nome" },
            { key: "larguraMm", label: "Largura (mm)" },
            { key: "alturaMm", label: "Altura (mm)" },
          ]}
          list={formatosImpressaoApi.list}
          create={formatosImpressaoApi.create}
          update={formatosImpressaoApi.update}
          remove={formatosImpressaoApi.remove}
        />
      )}

      {tab === "codigo" && (
        <EntityCrudPanel
          title="Código de Barras"
          emptyMessage="Nenhum formato de código de barras cadastrado."
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
            { key: "constante1", label: "Constante 1", type: "number" },
            { key: "constante2", label: "Constante 2", type: "number" },
          ]}
          columns={[
            { key: "numero", label: "Número" },
            { key: "nome", label: "Nome" },
            { key: "tipo", label: "Tipo" },
          ]}
          list={codigosBarrasFormatoApi.list}
          create={codigosBarrasFormatoApi.create}
          update={codigosBarrasFormatoApi.update}
          remove={codigosBarrasFormatoApi.remove}
        />
      )}

      {tab === "texto" && (
        <EntityCrudPanel
          title="Texto Global"
          emptyMessage="Nenhum texto global cadastrado."
          emptyForm={{ indice: 1, texto: "" }}
          fields={[
            { key: "indice", label: "Índice (1 a 8, texto 20~27 na balança)", type: "number", required: true },
            { key: "texto", label: "Texto (mensagem de propaganda)", type: "textarea", required: true },
          ]}
          columns={[
            { key: "indice", label: "Índice" },
            { key: "texto", label: "Texto" },
          ]}
          list={textosGlobaisApi.list}
          create={textosGlobaisApi.create}
          update={textosGlobaisApi.update}
          remove={textosGlobaisApi.remove}
        />
      )}

      {tab === "tecla" && (
        <EntityCrudPanel
          title="Tecla de Acesso Rápido"
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
            { key: "pagina", label: "Página" },
          ]}
          list={teclasAcessoRapidoApi.list}
          create={teclasAcessoRapidoApi.create}
          update={teclasAcessoRapidoApi.update}
          remove={teclasAcessoRapidoApi.remove}
        />
      )}
    </div>
  );
}
