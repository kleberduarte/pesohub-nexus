import { IsIP, IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export class CreateDeviceDto {
  @IsString()
  nome!: string;

  @IsIP()
  ip!: string;

  @IsInt()
  @Min(1)
  @Max(65535)
  porta: number = 33581;

  @IsOptional()
  @IsString()
  grupoId?: string;
}
