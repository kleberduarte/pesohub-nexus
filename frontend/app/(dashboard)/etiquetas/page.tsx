"use client";

import { useState } from "react";
import { EntityCrudPanel } from "../../../components/cadastros/EntityCrudPanel";
import { TeclaAcessoRapidoPanel } from "../../../components/cadastros/TeclaAcessoRapidoPanel";
import { FormatoImpressaoPanel } from "../../../components/cadastros/FormatoImpressaoPanel";
import { LayoutsPadraoPanel } from "../../../components/cadastros/LayoutsPadraoPanel";
import { codigosBarrasFormatoApi, textosGlobaisApi } from "../../../lib/api";

const TABS = [
  { key: "formato", label: "Formato de Impressão" },
  { key: "padrao", label: "Layouts padrão" },
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

      {tab === "formato" && <FormatoImpressaoPanel />}

      {tab === "padrao" && <LayoutsPadraoPanel />}

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

      {tab === "tecla" && <TeclaAcessoRapidoPanel />}
    </div>
  );
}
