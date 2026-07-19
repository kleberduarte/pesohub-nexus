"use client";

import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { configuracaoAvancadaApi, ApiError, type UpsertConfiguracaoAvancadaInput } from "../../../lib/api";

const MENUS = [
  "assistenteConfiguracao",
  "especificacoes",
  "textoGlobal",
  "loja",
  "setor",
  "plu",
  "teclaAcessoRapido",
  "formatoImpressao",
  "codigoBarras",
  "operador",
  "tabelaNutricional",
  "fornecedor",
  "alergicos",
] as const;

const MENU_LABELS: Record<(typeof MENUS)[number], string> = {
  assistenteConfiguracao: "Assistente de configuração",
  especificacoes: "Especificações (SPEC)",
  textoGlobal: "Texto global",
  loja: "Loja",
  setor: "Setor",
  plu: "PLU",
  teclaAcessoRapido: "Tecla de acesso rápido",
  formatoImpressao: "Formato de impressão",
  codigoBarras: "Código de barras",
  operador: "Operador",
  tabelaNutricional: "Tabela Nutricional",
  fornecedor: "Fornecedor",
  alergicos: "Alérgicos",
};

const FUNCOES_PLU = ["taraPorCento", "pesoFixo", "config2", "modoEspecial"] as const;
const FUNCAO_PLU_LABELS: Record<(typeof FUNCOES_PLU)[number], string> = {
  taraPorCento: "Tara por cento",
  pesoFixo: "Peso fixo",
  config2: "Config 2",
  modoEspecial: "Modo especial",
};

const IMPORTACAO_CAMPOS = [
  "nome",
  "codigoProduto",
  "endereco",
  "setorAssociado",
  "unidadeVenda",
  "tara",
  "precoUnit",
  "valor",
  "modoEspecial",
  "formatoImpressao",
  "codigoBarras",
  "imagem",
  "textoExtra1",
  "textoExtra2",
  "tabelaNutricional",
  "fornecedor",
  "alergicos",
  "diasDeVendas",
  "tempoDeVenda",
  "validadeDoPacote",
  "validadeEmDias",
  "descontoManual",
] as const;
const IMPORTACAO_LABELS: Record<(typeof IMPORTACAO_CAMPOS)[number], string> = {
  nome: "Nome",
  codigoProduto: "Código do produto",
  endereco: "Endereço",
  setorAssociado: "Setor associado",
  unidadeVenda: "Unidade de venda",
  tara: "Tara",
  precoUnit: "Preço unit.",
  valor: "Valor",
  modoEspecial: "Modo especial",
  formatoImpressao: "Formato de impressão",
  codigoBarras: "Código de barras",
  imagem: "Imagem",
  textoExtra1: "Texto extra 1",
  textoExtra2: "Texto extra 2",
  tabelaNutricional: "Tabela Nutricional",
  fornecedor: "Fornecedor",
  alergicos: "Alérgicos",
  diasDeVendas: "Dias de vendas",
  tempoDeVenda: "Tempo de venda",
  validadeDoPacote: "Validade do pacote",
  validadeEmDias: "Validade em dias",
  descontoManual: "Desconto manual",
};

export default function ConfiguracoesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [menusHabilitados, setMenusHabilitados] = useState<Record<string, boolean>>({});
  const [funcaoPluPermitir, setFuncaoPluPermitir] = useState<Record<string, boolean>>({});
  const [importacaoPluCampos, setImportacaoPluCampos] = useState<Record<string, boolean>>({});
  const [fonteExibicao, setFonteExibicao] = useState("");
  const [formatoDataHora, setFormatoDataHora] = useState("DD-MM-YY 24H");
  const [excluirRegistrosDias, setExcluirRegistrosDias] = useState<number | "">("");

  useEffect(() => {
    configuracaoAvancadaApi
      .get()
      .then((config) => {
        if (!config) return;
        setMenusHabilitados(config.menusHabilitados ?? {});
        setFuncaoPluPermitir(config.funcaoPluPermitir ?? {});
        setImportacaoPluCampos(config.importacaoPluCampos ?? {});
        setFonteExibicao(config.fonteExibicao ?? "");
        setFormatoDataHora(config.formatoDataHora ?? "DD-MM-YY 24H");
        setExcluirRegistrosDias(config.excluirRegistrosDias ?? "");
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Erro ao carregar configurações."))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const payload: UpsertConfiguracaoAvancadaInput = {
        menusHabilitados,
        funcaoPluPermitir,
        importacaoPluCampos,
        fonteExibicao,
        formatoDataHora,
        excluirRegistrosDias: excluirRegistrosDias === "" ? undefined : Number(excluirRegistrosDias),
      };
      await configuracaoAvancadaApi.upsert(payload);
      setMessage("Configurações salvas com sucesso.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao salvar configurações.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center text-slate-400 py-12">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">Configurações Avançadas</h2>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium disabled:opacity-60"
        >
          <Save className="w-4 h-4" /> {saving ? "Salvando..." : "Salvar"}
        </button>
      </div>

      {error && <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
      {message && (
        <div className="px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm">
          {message}
        </div>
      )}

      {/* Comum / Exibição */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2">Comum / Exibição</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Fonte</label>
            <input
              type="text"
              placeholder="Sistema padrão"
              value={fonteExibicao}
              onChange={(e) => setFonteExibicao(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Formato de data/hora</label>
            <select
              value={formatoDataHora}
              onChange={(e) => setFormatoDataHora(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500"
            >
              <option value="YYYY.MM.DD 24H">YYYY.MM.DD 24H</option>
              <option value="MM/DD/YY 24H">MM/DD/YY 24H</option>
              <option value="DD/MM/YY 24H">DD/MM/YY 24H</option>
              <option value="DD-MM-YY 24H">DD-MM-YY 24H</option>
              <option value="DD-MM-YY 12H">DD-MM-YY 12H</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Excluir registros antigos (dias)</label>
            <input
              type="number"
              value={excluirRegistrosDias}
              onChange={(e) => setExcluirRegistrosDias(e.target.value === "" ? "" : Number(e.target.value))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>
      </div>

      {/* Habilitar/Desabilitar menus */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2">Habilitar menu</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {MENUS.map((key) => (
            <label key={key} className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={menusHabilitados[key] ?? true}
                onChange={(e) => setMenusHabilitados({ ...menusHabilitados, [key]: e.target.checked })}
              />
              {MENU_LABELS[key]}
            </label>
          ))}
        </div>

        <h4 className="text-xs font-semibold text-slate-600 mt-5 mb-2">Função PLU permitir</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {FUNCOES_PLU.map((key) => (
            <label key={key} className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={funcaoPluPermitir[key] ?? false}
                onChange={(e) => setFuncaoPluPermitir({ ...funcaoPluPermitir, [key]: e.target.checked })}
              />
              {FUNCAO_PLU_LABELS[key]}
            </label>
          ))}
        </div>
      </div>

      {/* Importação PLU */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-800 mb-1 border-b border-slate-100 pb-2">Importação PLU</h3>
        <p className="text-xs text-slate-500 mb-4">
          Escolha quais campos devem ser mantidos ao abrir um novo arquivo (usado em Customizar arquivo/Excel-CSV).
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {IMPORTACAO_CAMPOS.map((key) => (
            <label key={key} className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={importacaoPluCampos[key] ?? false}
                onChange={(e) => setImportacaoPluCampos({ ...importacaoPluCampos, [key]: e.target.checked })}
              />
              {IMPORTACAO_LABELS[key]}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
