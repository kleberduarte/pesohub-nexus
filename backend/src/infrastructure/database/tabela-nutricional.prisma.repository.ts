import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "./prisma.service";
import { TabelaNutricional } from "../../domain/entities/tabela-nutricional.entity";
import {
  TabelaNutricionalInput,
  TabelaNutricionalRepository,
} from "../../domain/repositories/tabela-nutricional.repository";

@Injectable()
export class TabelaNutricionalPrismaRepository implements TabelaNutricionalRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(clienteId: string): Promise<TabelaNutricional[]> {
    return this.prisma.tabelaNutricional.findMany({
      where: { clienteId },
      orderBy: { numero: "asc" },
      include: { itens: { orderBy: { ordem: "asc" } } },
    }) as unknown as Promise<TabelaNutricional[]>;
  }

  findById(id: string, clienteId: string): Promise<TabelaNutricional | null> {
    return this.prisma.tabelaNutricional.findFirst({
      where: { id, clienteId },
      include: { itens: { orderBy: { ordem: "asc" } } },
    }) as unknown as Promise<TabelaNutricional | null>;
  }

  async create(data: TabelaNutricionalInput): Promise<TabelaNutricional> {
    try {
      return (await this.prisma.tabelaNutricional.create({
        data: {
          clienteId: data.clienteId,
          numero: data.numero,
          nome: data.nome,
          porcao: data.porcao,
          itens: { create: data.itens },
        },
        include: { itens: { orderBy: { ordem: "asc" } } },
      })) as unknown as TabelaNutricional;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new ConflictException("Já existe uma tabela nutricional com este número.");
      }
      throw err;
    }
  }

  async update(id: string, clienteId: string, data: Partial<TabelaNutricionalInput>): Promise<TabelaNutricional> {
    const existing = await this.prisma.tabelaNutricional.findFirst({ where: { id, clienteId } });
    if (!existing) {
      throw new NotFoundException("Tabela nutricional não encontrada.");
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.tabelaNutricional.update({
        where: { id },
        data: { numero: data.numero, nome: data.nome, porcao: data.porcao },
      });
      if (data.itens) {
        await tx.tabelaNutricionalItem.deleteMany({ where: { tabelaId: id } });
        await tx.tabelaNutricionalItem.createMany({
          data: data.itens.map((item) => ({ ...item, tabelaId: id })),
        });
      }
    });

    return this.findById(id, clienteId) as Promise<TabelaNutricional>;
  }

  async delete(id: string, clienteId: string): Promise<void> {
    const existing = await this.prisma.tabelaNutricional.findFirst({ where: { id, clienteId } });
    if (!existing) {
      throw new NotFoundException("Tabela nutricional não encontrada.");
    }
    await this.prisma.$transaction([
      this.prisma.tabelaNutricionalItem.deleteMany({ where: { tabelaId: id } }),
      this.prisma.tabelaNutricional.delete({ where: { id } }),
    ]);
  }
}
