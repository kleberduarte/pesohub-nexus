import { Product } from "../entities/product.entity";

export interface ProductRepository {
  findAll(clienteId: string): Promise<Product[]>;
  findById(id: string, clienteId: string): Promise<Product | null>;
  create(data: Omit<Product, "id" | "versao">): Promise<Product>;
  update(id: string, clienteId: string, data: Partial<Product>): Promise<Product>;
  delete(id: string, clienteId: string): Promise<void>;
  deleteAll(clienteId: string): Promise<number>;
}

export const PRODUCT_REPOSITORY = Symbol("PRODUCT_REPOSITORY");
