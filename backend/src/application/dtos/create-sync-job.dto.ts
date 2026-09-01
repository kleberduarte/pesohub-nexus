import { ArrayMaxSize, ArrayMinSize, IsArray, IsIn, IsOptional, IsString } from "class-validator";

export class CreateSyncJobDto {
  // Sem teto, um único POST /sync podia enfileirar milhões de jobs e derrubar
  // o Redis/worker. O teto casa com o tamanho de lote do dispatcher.
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @IsString({ each: true })
  deviceIds!: string[];

  @IsIn(["TOTAL", "INCREMENTAL"])
  tipo!: "TOTAL" | "INCREMENTAL";

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10000)
  @IsString({ each: true })
  productIds?: string[];
}
