export type UnidadeVenda = "PESO" | "PECA";

export class Product {
  id!: string;
  clienteId!: string;
  codigo!: string;
  codigoBarras!: string;
  nome!: string;
  preco!: number;
  categoriaImposto?: string | null;
  ativo!: boolean;
  versao!: number;

  lote?: string | null;
  unidadeVenda!: UnidadeVenda;
  tara?: number | null;
  taraPorCento!: boolean;
  pesoFixo!: boolean;
  desconto?: number | null;
  modoEspecial!: number;

  subSetorId?: string | null;
  tabelaNutricionalId?: string | null;
  fornecedorId?: string | null;
  alergicoId?: string | null;
  imagemId?: string | null;
  formatoImpressaoId?: string | null;
  codigoBarrasFormatoId?: string | null;
  bandeiraCodigoBarras?: number | null;

  textoExtra1?: string | null;
  textoExtra2?: string | null;
  textoExtra3?: string | null;
  textoExtra4?: string | null;
  textoExtra5?: string | null;
  textoExtra6?: string | null;
  textoExtra7?: string | null;

  diasDeVenda?: number | null;
  tempoDeVenda?: number | null;
  validadePacote?: number | null;
  validadePacoteHoras?: number | null;
  validadeDias?: number | null;
}
