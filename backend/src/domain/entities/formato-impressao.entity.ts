export class FormatoImpressao {
  id!: string;
  clienteId!: string;
  lojaId!: string;
  numero!: number;
  nome!: string;
  tipo!: number;
  larguraMm!: number;
  alturaMm!: number;
  layout?: Record<string, unknown> | null;
}
