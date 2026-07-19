export class Operador {
  id!: string;
  clienteId!: string;
  numero!: number;
  nome!: string;
  senha!: string;
  codigo?: string | null;
  permissoes?: Record<string, boolean> | null;
}
