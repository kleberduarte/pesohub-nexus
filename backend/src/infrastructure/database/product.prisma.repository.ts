import { Injectable } from "@nestjs/common";
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

  create(data: Omit<Product, "id" | "versao">): Promise<Product> {
    return this.prisma.product.create({ data }) as unknown as Promise<Product>;
  }

  update(id: string, data: Partial<Product>): Promise<Product> {
    return this.prisma.product.update({
      where: { id },
      data: { ...data, versao: { increment: 1 } },
    }) as unknown as Promise<Product>;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.product.delete({ where: { id } });
  }
}
