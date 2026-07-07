import { IsArray, IsIn, IsOptional, IsString } from "class-validator";

export class CreateSyncJobDto {
  @IsArray()
  @IsString({ each: true })
  deviceIds!: string[];

  @IsIn(["TOTAL", "INCREMENTAL"])
  tipo!: "TOTAL" | "INCREMENTAL";

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  productIds?: string[];
}
