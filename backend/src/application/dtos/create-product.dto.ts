import { IsBoolean, IsIn, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Matches, MaxLength } from "class-validator";

const UNIDADES_VENDA = ["PESO", "PECA"] as const;

export class CreateProductDto {
  @IsString()
  @MaxLength(32)
  @IsNotEmpty()
  codigo!: string;

  @IsString()
  @MaxLength(32)
  @Matches(/^\d{13}$/, { message: "codigoBarras deve conter 13 dígitos (EAN-13)" })
  codigoBarras!: string;

  @IsString()
  @MaxLength(120)
  @IsNotEmpty()
  nome!: string;

  @IsNumber()
  preco!: number;

  @IsOptional()
  @IsNumber()
  custo?: number;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  categoriaImposto?: string;

  @IsOptional()
  @IsIn([0, 1, 2, 3])
  taxType?: number;

  @IsOptional()
  @IsNumber()
  taxaImposto?: number;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(64)
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
  @MaxLength(128)
  subSetorId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  tabelaNutricionalId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  fornecedorId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  alergicoId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  imagemId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  formatoImpressaoId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  codigoBarrasFormatoId?: string;

  @IsOptional()
  @IsInt()
  bandeiraCodigoBarras?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  textoExtra1?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  textoExtra2?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  textoExtra3?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  textoExtra4?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  textoExtra5?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  textoExtra6?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
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
