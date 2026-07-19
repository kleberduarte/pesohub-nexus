import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "./prisma.service";
import { SubSetor } from "../../domain/entities/sub-setor.entity";
import { SubSetorRepository } from "../../domain/repositories/sub-setor.repository";

@Injectable()
export class SubSetorPrismaRepository implements SubSetorRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(clienteId: string): Promise<SubSetor[]> {
    return this.prisma.subSetor.findMany({ where: { clienteId }, orderBy: { numero: "asc" } });
  }

  findById(id: string, clienteId: string): Promise<SubSetor | null> {
    return this.prisma.subSetor.findFirst({ where: { id, clienteId } });
  }

  async create(data: Omit<SubSetor, "id">): Promise<SubSetor> {
    try {
      return await this.prisma.subSetor.create({ data });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new ConflictException("Já existe um sub-setor com este número.");
      }
      throw err;
    }
  }

  async update(id: string, clienteId: string, data: Partial<SubSetor>): Promise<SubSetor> {
    const result = await this.prisma.subSetor.updateMany({ where: { id, clienteId }, data });
    if (result.count === 0) {
      throw new NotFoundException("Sub-setor não encontrado.");
    }
    return this.prisma.subSetor.findFirst({ where: { id, clienteId } }) as Promise<SubSetor>;
  }

  async delete(id: string, clienteId: string): Promise<void> {
    const result = await this.prisma.subSetor.deleteMany({ where: { id, clienteId } });
    if (result.count === 0) {
      throw new NotFoundException("Sub-setor não encontrado.");
    }
  }
}
