-- Imposto (idx57/58 do PLU -> TaxType/Tax) precisa de um modo de cálculo (inteiro
-- 0-3) e uma alíquota numérica (%) para virar os dois campos inteiros que a
-- balança exige de verdade; "categoriaImposto" (texto livre) não carrega isso.
-- Semântica achada em RDS.cs do Ramuza.exe decompilado -- ver memória
-- project_ramuza_full_field_map_2026_08_28.
ALTER TABLE "Product" ADD COLUMN     "taxType" INTEGER DEFAULT 0,
ADD COLUMN     "taxaImposto" DECIMAL(5,2);
