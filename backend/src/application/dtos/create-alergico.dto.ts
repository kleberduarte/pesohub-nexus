import { IsInt, IsOptional, IsString } from "class-validator";

export class CreateAlergicoDto {
  @IsInt()
  numero!: number;

  @IsString()
  nome!: string;

  @IsOptional()
  @IsString()
  informacao?: string;
}
