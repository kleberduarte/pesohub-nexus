export type NutrienteUnidade = "KCAL_KJ" | "G" | "MG" | "MCG";

export class TabelaNutricionalItem {
  id!: string;
  ordem!: number;
  ingrediente!: string;
  unidade!: NutrienteUnidade;
  valor!: number;
  porcentagem!: number;
}

export class TabelaNutricional {
  id!: string;
  clienteId!: string;
  lojaId!: string;
  numero!: number;
  nome!: string;
  porcao?: string | null;
  porcoesPorEmbalagem?: number | null;
  ingredientes?: string | null;
  selos!: string[];
  itens!: TabelaNutricionalItem[];
}
