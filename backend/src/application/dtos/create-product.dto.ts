import { IsBoolean, IsIn, IsInt, IsNumber, IsOptional, IsString, Length, Matches } from "class-validator";

const UNIDADES_VENDA = ["PESO", "PECA"] as const;

export class CreateProductDto {
  @IsString()
  codigo!: string;

  @IsString()
  @Length(13, 13)
  @Matches(/^\d{13}$/, { message: "codigoBarras deve conter 13 dígitos (EAN-13)" })
  codigoBarras!: string;

  @IsString()
  nome!: string;

  @IsNumber()
  preco!: number;

  @IsOptional()
  @IsString()
  categoriaImposto?: string;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @IsOptional()
  @IsString()
  lote?: string;

  @IsOptional()
  @IsIn(UNIDADES_VENDA)
  unidadeVenda?: (typeof UNIDADES_VENDA)[number];

  @IsOptional()
  @IsNumber()
  tara?: number;

  @IsOptional()
  @IsBoolean()
  taraPorCento?: boolean;

  @IsOptional()
  @IsBoolean()
  pesoFixo?: boolean;

  @IsOptional()
  @IsNumber()
  desconto?: number;

  @IsOptional()
  @IsInt()
  modoEspecial?: number;

  @IsOptional()
  @IsString()
  subSetorId?: string;

  @IsOptional()
  @IsString()
  tabelaNutricionalId?: string;

  @IsOptional()
  @IsString()
  fornecedorId?: string;

  @IsOptional()
  @IsString()
  alergicoId?: string;

  @IsOptional()
  @IsString()
  imagemId?: string;

  @IsOptional()
  @IsString()
  formatoImpressaoId?: string;

  @IsOptional()
  @IsString()
  codigoBarrasFormatoId?: string;

  @IsOptional()
  @IsInt()
  bandeiraCodigoBarras?: number;

  @IsOptional()
  @IsString()
  textoExtra1?: string;

  @IsOptional()
  @IsString()
  textoExtra2?: string;

  @IsOptional()
  @IsString()
  textoExtra3?: string;

  @IsOptional()
  @IsString()
  textoExtra4?: string;

  @IsOptional()
  @IsString()
  textoExtra5?: string;

  @IsOptional()
  @IsString()
  textoExtra6?: string;

  @IsOptional()
  @IsString()
  textoExtra7?: string;

  @IsOptional()
  @IsInt()
  diasDeVenda?: number;

  @IsOptional()
  @IsInt()
  tempoDeVenda?: number;

  @IsOptional()
  @IsInt()
  validadePacote?: number;

  @IsOptional()
  @IsInt()
  validadePacoteHoras?: number;

  @IsOptional()
  @IsInt()
  validadeDias?: number;
}
