import { IsEnum, IsNotEmpty, IsNumber, IsString, Min } from "class-validator";

export class CreateAssinaturaDto {
  @IsEnum(["PIX", "BOLETO", "CARTAO_CREDITO"])
  formaPagamento!: "PIX" | "BOLETO" | "CARTAO_CREDITO";

  @IsNumber()
  @Min(0.01)
  valor!: number;

  @IsString()
  @IsNotEmpty()
  cpfCnpj!: string;
}
