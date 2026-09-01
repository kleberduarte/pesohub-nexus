import { IsIP, IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";

export class CreateDeviceDto {
  @IsString()
  @MaxLength(120)
  @IsNotEmpty()
  nome!: string;

  @IsIP()
  ip!: string;

  @IsInt()
  @Min(1)
  @Max(65535)
  porta: number = 33581;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  grupoId?: string;
}
