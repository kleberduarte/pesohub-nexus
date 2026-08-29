import { IsInt, IsNotEmpty, IsObject, IsOptional, IsString, Max, Min } from "class-validator";

export class CreateFormatoImpressaoDto {
  /** Vira o `LabelID` do protocolo da balança (`DWL/LAB`) — faixa 1-99
   * confirmada empiricamente contra o hardware físico em 2026-08-28 (100+
   * é aceito com ACK mas descartado em silêncio pelo firmware, mesma classe
   * de bug do `minUserPLUID`/`maxUserPLUID` já conhecida pro PLU). Ver
   * [[project_ramuza_full_field_map_2026_08_28]]. */
  @IsInt()
  @Min(1)
  @Max(99)
  numero!: number;

  @IsString()
  @IsNotEmpty()
  nome!: string;

  @IsOptional()
  @IsInt()
  tipo?: number;

  @IsInt()
  larguraMm!: number;

  @IsInt()
  alturaMm!: number;

  @IsOptional()
  @IsObject()
  layout?: Record<string, unknown>;
}
