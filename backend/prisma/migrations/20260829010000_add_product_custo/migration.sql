-- Custo do produto (idx6 do PLU -> Cost) nao tinha campo modelado no Product.
ALTER TABLE "Product" ADD COLUMN     "custo" DECIMAL(10,2);
