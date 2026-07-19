import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "./prisma.service";
import { TextoGlobal } from "../../domain/entities/texto-global.entity";
import { TextoGlobalRepository } from "../../domain/repositories/texto-global.repository";

@Injectable()
export class TextoGlobalPrismaRepository implements TextoGlobalRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(clienteId: string): Promise<TextoGlobal[]> {
    return this.prisma.textoGlobal.findMany({ where: { clienteId }, orderBy: { indice: "asc" } });
  }

  findById(id: string, clienteId: string): Promise<TextoGlobal | null> {
    return this.prisma.textoGlobal.findFirst({ where: { id, clienteId } });
  }

  async create(data: Omit<TextoGlobal, "id">): Promise<TextoGlobal> {
    try {
      return await this.prisma.textoGlobal.create({ data });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new ConflictException("Já existe um texto global com este índice.");
      }
      throw err;
    }
  }

  async update(id: string, clienteId: string, data: Partial<TextoGlobal>): Promise<TextoGlobal> {
    const result = await this.prisma.textoGlobal.updateMany({ where: { id, clienteId }, data });
    if (result.count === 0) {
      throw new NotFoundException("Texto global não encontrado.");
    }
    return this.prisma.textoGlobal.findFirst({ where: { id, clienteId } }) as Promise<TextoGlobal>;
  }

  async delete(id: string, clienteId: string): Promise<void> {
    const result = await this.prisma.textoGlobal.deleteMany({ where: { id, clienteId } });
    if (result.count === 0) {
      throw new NotFoundException("Texto global não encontrado.");
    }
  }
}
