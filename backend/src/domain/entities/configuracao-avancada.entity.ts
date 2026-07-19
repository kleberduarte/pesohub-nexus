export class ConfiguracaoAvancada {
  id!: string;
  clienteId!: string;
  menusHabilitados?: Record<string, boolean> | null;
  funcaoPluPermitir?: Record<string, boolean> | null;
  fonteExibicao?: string | null;
  formatoDataHora?: string | null;
  excluirRegistrosDias?: number | null;
  importacaoPluCampos?: Record<string, boolean> | null;
}
