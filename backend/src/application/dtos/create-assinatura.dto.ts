import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

/**
 * Contratação da assinatura de uma rede (card #97).
 *
 * NÃO existe campo de valor aqui, de propósito: o total é calculado no backend
 * a partir das balanças cadastradas e do preço acordado. Aceitar valor da tela
 * deixaria qualquer cliente escolher quanto pagar.
 */
export class CreateAssinaturaDto {
  @IsEnum(["PIX", "BOLETO", "CARTAO_CREDITO"])
  formaPagamento!: "PIX" | "BOLETO" | "CARTAO_CREDITO";

  @IsString()
  @MaxLength(24)
  @IsNotEmpty()
  cpfCnpj!: string;

  /** Rede a assinar. Só quem administra a empresa pode indicar outra que não a própria. */
  @IsOptional()
  @IsString()
  @MaxLength(255)
  dominioRede?: string;
}
