"use client";

import { useEffect, useState } from "react";
import { EntityCrudPanel } from "../../../components/cadastros/EntityCrudPanel";
import { TabelaNutricionalPanel } from "../../../components/cadastros/TabelaNutricionalPanel";
import { ImagemPanel } from "../../../components/cadastros/ImagemPanel";
import {
  alergicosApi,
  fornecedoresApi,
  operadoresApi,
  setoresApi,
  subSetoresApi,
  type Setor,
} from "../../../lib/api";

const TABS = [
  { key: "setor", label: "Setor" },
  { key: "subsetor", label: "Sub-Setor" },
  { key: "fornecedor", label: "Fornecedor" },
  { key: "alergico", label: "Alérgicos" },
  { key: "tabela", label: "Tabela Nutricional" },
  { key: "operador", label: "Operador" },
  { key: "imagem", label: "Imagem" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function CadastrosPage() {
  const [tab, setTab] = useState<TabKey>("setor");
  const [setores, setSetores] = useState<Setor[]>([]);

  useEffect(() => {
    setoresApi.list().then(setSetores).catch(() => setSetores([]));
  }, [tab]);

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

      {tab === "setor" && (
        <EntityCrudPanel
          title="Setor"
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

      {tab === "subsetor" && (
        <EntityCrudPanel
          title="Sub-Setor"
          emptyForm={{ numero: 0, nome: "", setorId: "" }}
          fields={[
            { key: "numero", label: "Número", type: "number", required: true },
            { key: "nome", label: "Nome", type: "text", required: true },
            {
              key: "setorId",
              label: "Setor associado",
              type: "select",
              required: true,
              options: setores.map((s) => ({ value: s.id, label: `${s.numero} - ${s.nome}` })),
            },
            { key: "bandeiraCodigoBarras", label: "Bandeira de código de barras", type: "number" },
          ]}
          columns={[
            { key: "numero", label: "Número" },
            { key: "nome", label: "Nome" },
            {
              key: "setorId",
              label: "Setor",
              render: (item) => setores.find((s) => s.id === (item as { setorId: string }).setorId)?.nome ?? "-",
            },
          ]}
          list={subSetoresApi.list}
          create={subSetoresApi.create}
          update={subSetoresApi.update}
          remove={subSetoresApi.remove}
        />
      )}

      {tab === "fornecedor" && (
        <EntityCrudPanel
          title="Fornecedor"
          emptyForm={{ numero: 0, nome: "", informacao: "" }}
          fields={[
            { key: "numero", label: "Número", type: "number", required: true },
            { key: "nome", label: "Nome", type: "text", required: true },
            { key: "informacao", label: "Informação (endereço, CNPJ...)", type: "textarea" },
          ]}
          columns={[
            { key: "numero", label: "Número" },
            { key: "nome", label: "Nome" },
          ]}
          list={fornecedoresApi.list}
          create={fornecedoresApi.create}
          update={fornecedoresApi.update}
          remove={fornecedoresApi.remove}
        />
      )}

      {tab === "alergico" && (
        <EntityCrudPanel
          title="Alérgico"
          emptyForm={{ numero: 0, nome: "", informacao: "" }}
          fields={[
            { key: "numero", label: "Número", type: "number", required: true },
            { key: "nome", label: "Nome", type: "text", required: true },
            { key: "informacao", label: "Informação (a imprimir com o produto)", type: "textarea" },
          ]}
          columns={[
            { key: "numero", label: "Número" },
            { key: "nome", label: "Nome" },
          ]}
          list={alergicosApi.list}
          create={alergicosApi.create}
          update={alergicosApi.update}
          remove={alergicosApi.remove}
        />
      )}

      {tab === "tabela" && <TabelaNutricionalPanel />}

      {tab === "operador" && (
        <EntityCrudPanel
          title="Operador"
          emptyForm={{ numero: 0, nome: "", senha: "", codigo: "" }}
          fields={[
            { key: "numero", label: "Número", type: "number", required: true },
            { key: "nome", label: "Nome", type: "text", required: true },
            { key: "senha", label: "Senha (até 7 dígitos, deixe em branco para não alterar)", type: "text" },
            { key: "codigo", label: "Código", type: "text" },
          ]}
          columns={[
            { key: "numero", label: "Número" },
            { key: "nome", label: "Nome" },
            { key: "codigo", label: "Código" },
          ]}
          csv={false}
          list={operadoresApi.list}
          create={(data) => operadoresApi.create(data as Parameters<typeof operadoresApi.create>[0])}
          update={(id, data) => {
            const payload = { ...data };
            if (!payload.senha) delete payload.senha;
            return operadoresApi.update(id, payload);
          }}
          remove={operadoresApi.remove}
        />
      )}

      {tab === "imagem" && <ImagemPanel />}
    </div>
  );
}
