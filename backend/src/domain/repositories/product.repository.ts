import { Product } from "../entities/product.entity";

export interface ProductRepository {
  findAll(lojaId: string): Promise<Product[]>;
  findById(id: string, lojaId: string): Promise<Product | null>;
  create(data: Omit<Product, "id" | "versao">): Promise<Product>;
  update(id: string, lojaId: string, data: Partial<Product>): Promise<Product>;
  delete(id: string, lojaId: string): Promise<void>;
  deleteAll(lojaId: string): Promise<number>;
}

export const PRODUCT_REPOSITORY = Symbol("PRODUCT_REPOSITORY");
