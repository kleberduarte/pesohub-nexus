import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "./prisma.service";
import { Imagem } from "../../domain/entities/imagem.entity";
import { ImagemRepository } from "../../domain/repositories/imagem.repository";

@Injectable()
export class ImagemPrismaRepository implements ImagemRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(lojaId: string): Promise<Imagem[]> {
    return this.prisma.imagem.findMany({
      where: { lojaId },
      orderBy: { nome: "asc" },
    }) as unknown as Promise<Imagem[]>;
  }

  findById(id: string, lojaId: string): Promise<Imagem | null> {
    return this.prisma.imagem.findFirst({ where: { id, lojaId } }) as unknown as Promise<Imagem | null>;
  }

  async create(data: Omit<Imagem, "id">): Promise<Imagem> {
    return (await this.prisma.imagem.create({ data })) as unknown as Imagem;
  }

  async update(id: string, lojaId: string, data: Partial<Imagem>): Promise<Imagem> {
    const result = await this.prisma.imagem.updateMany({ where: { id, lojaId }, data });
    if (result.count === 0) {
      throw new NotFoundException("Imagem não encontrada.");
    }
    return this.prisma.imagem.findFirst({ where: { id, lojaId } }) as unknown as Promise<Imagem>;
  }

  async delete(id: string, lojaId: string): Promise<void> {
    const result = await this.prisma.imagem.deleteMany({ where: { id, lojaId } });
    if (result.count === 0) {
      throw new NotFoundException("Imagem não encontrada.");
    }
  }
}
