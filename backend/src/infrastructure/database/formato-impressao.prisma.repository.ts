import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "./prisma.service";
import { FormatoImpressao } from "../../domain/entities/formato-impressao.entity";
import { FormatoImpressaoRepository } from "../../domain/repositories/formato-impressao.repository";

@Injectable()
export class FormatoImpressaoPrismaRepository implements FormatoImpressaoRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(lojaId: string): Promise<FormatoImpressao[]> {
    return this.prisma.formatoImpressao.findMany({
      where: { lojaId },
      orderBy: { numero: "asc" },
    }) as unknown as Promise<FormatoImpressao[]>;
  }

  findById(id: string, lojaId: string): Promise<FormatoImpressao | null> {
    return this.prisma.formatoImpressao.findFirst({
      where: { id, lojaId },
    }) as unknown as Promise<FormatoImpressao | null>;
  }

  async create(data: Omit<FormatoImpressao, "id">): Promise<FormatoImpressao> {
    try {
      return (await this.prisma.formatoImpressao.create({
        data: data as unknown as Prisma.FormatoImpressaoUncheckedCreateInput,
      })) as unknown as FormatoImpressao;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new ConflictException("Já existe um formato de impressão com este número.");
      }
      throw err;
    }
  }

  async update(id: string, lojaId: string, data: Partial<FormatoImpressao>): Promise<FormatoImpressao> {
    const result = await this.prisma.formatoImpressao.updateMany({
      where: { id, lojaId },
      data: data as unknown as Prisma.FormatoImpressaoUncheckedUpdateManyInput,
    });
    if (result.count === 0) {
      throw new NotFoundException("Formato de impressão não encontrado.");
    }
    return this.prisma.formatoImpressao.findFirst({
      where: { id, lojaId },
    }) as unknown as Promise<FormatoImpressao>;
  }

  async delete(id: string, lojaId: string): Promise<void> {
    const result = await this.prisma.formatoImpressao.deleteMany({ where: { id, lojaId } });
    if (result.count === 0) {
      throw new NotFoundException("Formato de impressão não encontrado.");
    }
  }
}
