import { Type } from "class-transformer";
import { ArrayMaxSize, ArrayMinSize, IsArray, IsIP, IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min, ValidateNested } from "class-validator";

export class ImportDeviceRowDto {
  @IsString()
  @MaxLength(128)
  @IsNotEmpty()
  lojaId!: string;

  @IsString()
  @MaxLength(120)
  @IsNotEmpty()
  nome!: string;

  @IsIP()
  ip!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  porta?: number;
}

export class ImportDevicesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(5000)
  @ValidateNested({ each: true })
  @Type(() => ImportDeviceRowDto)
  rows!: ImportDeviceRowDto[];
}
