import { IsInt, IsNotEmpty, IsString, MaxLength, Min } from "class-validator";

export class CreateSetorDto {
  // 1-9 são ClassIDs reservados pela balança (Diversos-Peso, Taxa de
  // serviço, Padrão, etc. — confirmado via UPL/CLS no hardware físico em
  // 2026-08-29); escrever um Setor nessa faixa sobrescreveria essas classes
  // do sistema quando sincronizado (idx14 do PLU). Ver
  // project_ramuza_full_field_map_2026_08_28.
  @IsInt()
  @Min(10)
  numero!: number;

  @IsString()
  @MaxLength(120)
  @IsNotEmpty()
  nome!: string;
}
