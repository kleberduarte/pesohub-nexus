import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "./prisma.service";
import { Product } from "../../domain/entities/product.entity";
import { ProductRepository } from "../../domain/repositories/product.repository";

@Injectable()
export class ProductPrismaRepository implements ProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(clienteId: string): Promise<Product[]> {
    return this.prisma.product.findMany({ where: { clienteId } }) as unknown as Promise<Product[]>;
  }

  findById(id: string, clienteId: string): Promise<Product | null> {
    return this.prisma.product.findFirst({ where: { id, clienteId } }) as unknown as Promise<Product | null>;
  }

  async create(data: Omit<Product, "id" | "versao">): Promise<Product> {
    try {
      return (await this.prisma.product.create({
        data: data as unknown as Prisma.ProductUncheckedCreateInput,
      })) as unknown as Product;
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
      data: { ...data, versao: { increment: 1 } } as unknown as Prisma.ProductUncheckedUpdateManyInput,
    });
    if (result.count === 0) {
      throw new NotFoundException("Produto não encontrado.");
    }
    return this.prisma.product.findFirst({ where: { id, clienteId } }) as unknown as Promise<Product>;
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
