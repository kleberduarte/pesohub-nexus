export type CodigoBarrasTipo = "EAN13" | "EAN128";

export class CodigoBarrasFormato {
  id!: string;
  clienteId!: string;
  numero!: number;
  nome!: string;
  tipo!: CodigoBarrasTipo;
  verificador!: number;
  constante1?: number | null;
  constante2?: number | null;
  detalhes?: Record<string, unknown> | null;
}
