import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from "class-validator";

export class UpdateSetorDto {
  // Ver ressalva em create-setor.dto.ts — 1-9 são ClassIDs reservados pela balança.
  @IsOptional()
  @IsInt()
  @Min(10)
  numero?: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  @IsNotEmpty()
  nome?: string;
}
