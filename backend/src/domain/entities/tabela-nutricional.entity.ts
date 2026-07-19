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
  numero!: number;
  nome!: string;
  porcao?: string | null;
  itens!: TabelaNutricionalItem[];
}
