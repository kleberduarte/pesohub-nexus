import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "./prisma.service";
import { Product } from "../../domain/entities/product.entity";
import { ProductRepository } from "../../domain/repositories/product.repository";

@Injectable()
export class ProductPrismaRepository implements ProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<Product[]> {
    return this.prisma.product.findMany() as unknown as Promise<Product[]>;
  }

  findById(id: string): Promise<Product | null> {
    return this.prisma.product.findUnique({ where: { id } }) as unknown as Promise<Product | null>;
  }

  async create(data: Omit<Product, "id" | "versao">): Promise<Product> {
    try {
      return (await this.prisma.product.create({ data })) as unknown as Product;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new ConflictException("Já existe um produto com este código de barras.");
      }
      throw err;
    }
  }

  update(id: string, data: Partial<Product>): Promise<Product> {
    return this.prisma.product.update({
      where: { id },
      data: { ...data, versao: { increment: 1 } },
    }) as unknown as Promise<Product>;
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.$transaction([
        this.prisma.syncJobItem.deleteMany({ where: { productId: id } }),
        this.prisma.product.delete({ where: { id } }),
      ]);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
        throw new NotFoundException("Produto não encontrado.");
      }
      throw err;
    }
  }
}
