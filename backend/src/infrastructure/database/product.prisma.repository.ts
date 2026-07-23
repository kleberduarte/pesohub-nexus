import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "./prisma.service";
import { Product } from "../../domain/entities/product.entity";
import { ProductRepository } from "../../domain/repositories/product.repository";

const RELATION_ID_FIELDS = [
  "subSetorId",
  "tabelaNutricionalId",
  "fornecedorId",
  "alergicoId",
  "imagemId",
  "formatoImpressaoId",
  "codigoBarrasFormatoId",
] as const;

/**
 * O formulário do frontend manda "" para relações opcionais não selecionadas
 * (select com option value=""); isso viraria uma FK inválida no Prisma.
 */
function sanitizeRelationIds<T extends Record<string, unknown>>(data: T): T {
  const sanitized = { ...data };
  for (const field of RELATION_ID_FIELDS) {
    if (sanitized[field] === "") {
      (sanitized as Record<string, unknown>)[field] = null;
    }
  }
  return sanitized;
}

const DECIMAL_FIELDS = ["preco", "tara", "desconto"] as const;

/**
 * Campos Decimal do Prisma serializam para JSON como string; sem essa
 * conversão o frontend reenvia o valor como string num PATCH seguinte e
 * o @IsNumber() do DTO rejeita com 400.
 */
function toProduct(row: Record<string, unknown> | null): Product | null {
  if (!row) return null;
  const result = { ...row };
  for (const field of DECIMAL_FIELDS) {
    if (result[field] != null) {
      result[field] = Number(result[field]);
    }
  }
  return result as unknown as Product;
}

@Injectable()
export class ProductPrismaRepository implements ProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(clienteId: string): Promise<Product[]> {
    const rows = await this.prisma.product.findMany({ where: { clienteId } });
    return rows.map((row) => toProduct(row as unknown as Record<string, unknown>) as Product);
  }

  async findById(id: string, clienteId: string): Promise<Product | null> {
    const row = await this.prisma.product.findFirst({ where: { id, clienteId } });
    return toProduct(row as unknown as Record<string, unknown> | null);
  }

  async create(data: Omit<Product, "id" | "versao">): Promise<Product> {
    try {
      const row = await this.prisma.product.create({
        data: sanitizeRelationIds(data) as unknown as Prisma.ProductUncheckedCreateInput,
      });
      return toProduct(row as unknown as Record<string, unknown>) as Product;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new ConflictException("Já existe um produto com este código de barras.");
      }
      throw err;
    }
  }

  async update(id: string, clienteId: string, data: Partial<Product>): Promise<Product> {
    const result = await this.prisma.product.updateMany({
      where: { id, clienteId },
      data: { ...sanitizeRelationIds(data), versao: { increment: 1 } } as unknown as Prisma.ProductUncheckedUpdateManyInput,
    });
    if (result.count === 0) {
      throw new NotFoundException("Produto não encontrado.");
    }
    const row = await this.prisma.product.findFirst({ where: { id, clienteId } });
    return toProduct(row as unknown as Record<string, unknown> | null) as Product;
  }

  async delete(id: string, clienteId: string): Promise<void> {
    const product = await this.prisma.product.findFirst({ where: { id, clienteId } });
    if (!product) {
      throw new NotFoundException("Produto não encontrado.");
    }
    await this.prisma.$transaction([
      this.prisma.syncJobItem.deleteMany({ where: { productId: id } }),
      this.prisma.product.delete({ where: { id } }),
    ]);
  }

  async deleteAll(clienteId: string): Promise<number> {
    const ids = (
      await this.prisma.product.findMany({ where: { clienteId }, select: { id: true } })
    ).map((p) => p.id);
    if (ids.length === 0) return 0;

    const result = await this.prisma.$transaction([
      this.prisma.syncJobItem.deleteMany({ where: { productId: { in: ids } } }),
      this.prisma.product.deleteMany({ where: { clienteId } }),
    ]);
    return result[1].count;
  }
}
