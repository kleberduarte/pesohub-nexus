import type { NutrienteUnidade } from "./api";

/**
 * A balança grava a tabela nutricional num formato de wire FIXO: 10 slots
 * padrão (idx7-26 do NU3, ver [[project_scale_protocol_field_gap]] na
 * memória do projeto) sempre nessa ordem — `ordem` 1-10 mapeia
 * POSICIONALMENTE pra esses slots, não pelo texto de `ingrediente`. Índices
 * acima de 10 viram nutrientes extras de verdade (nome livre).
 */
export const NUTRIENTES_PADRAO: { nome: string; unidade: NutrienteUnidade }[] = [
  { nome: "Valor energético", unidade: "KCAL_KJ" },
  { nome: "Carboidratos", unidade: "G" },
  { nome: "Açúcares totais", unidade: "G" },
  { nome: "Açúcares adicionados", unidade: "G" },
  { nome: "Proteínas", unidade: "G" },
  { nome: "Gorduras totais", unidade: "G" },
  { nome: "Gorduras saturadas", unidade: "G" },
  { nome: "Gordura trans", unidade: "G" },
  { nome: "Fibra alimentar", unidade: "G" },
  { nome: "Sódio", unidade: "MG" },
];
