import { IsEnum, IsNotEmpty, IsNumber, IsString, MaxLength, Min } from "class-validator";

export class CreateAssinaturaDto {
  @IsEnum(["PIX", "BOLETO", "CARTAO_CREDITO"])
  formaPagamento!: "PIX" | "BOLETO" | "CARTAO_CREDITO";

  @IsNumber()
  @Min(0.01)
  valor!: number;

  @IsString()
  @MaxLength(24)
  @IsNotEmpty()
  cpfCnpj!: string;
}
