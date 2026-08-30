import { Product } from "../entities/product.entity";
import { PaginatedResult } from "./pagination";

export interface ProductRepository {
  findAll(lojaId: string): Promise<Product[]>;
  findAllPaginated(lojaId: string, query: ProductListQuery): Promise<PaginatedResult<Product>>;
  findById(id: string, lojaId: string): Promise<Product | null>;
  create(data: Omit<Product, "id" | "versao">): Promise<Product>;
  update(id: string, lojaId: string, data: Partial<Product>): Promise<Product>;
  delete(id: string, lojaId: string): Promise<void>;
  deleteAll(lojaId: string): Promise<number>;
}

export interface ProductListQuery {
  page: number;
  pageSize: number;
  /** Busca por nome, código ou código de barras. */
  search?: string;
  /** `undefined` traz ativos e inativos. */
  ativo?: boolean;
}

export const PRODUCT_REPOSITORY = Symbol("PRODUCT_REPOSITORY");
