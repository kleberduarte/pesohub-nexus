import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "./prisma.service";
import { Setor } from "../../domain/entities/setor.entity";
import { SetorRepository } from "../../domain/repositories/setor.repository";

@Injectable()
export class SetorPrismaRepository implements SetorRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(clienteId: string): Promise<Setor[]> {
    return this.prisma.setor.findMany({ where: { clienteId }, orderBy: { numero: "asc" } });
  }

  findById(id: string, clienteId: string): Promise<Setor | null> {
    return this.prisma.setor.findFirst({ where: { id, clienteId } });
  }

  async create(data: Omit<Setor, "id">): Promise<Setor> {
    try {
      return await this.prisma.setor.create({ data });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new ConflictException("Já existe um setor com este número.");
      }
      throw err;
    }
  }

  async update(id: string, clienteId: string, data: Partial<Setor>): Promise<Setor> {
    const result = await this.prisma.setor.updateMany({ where: { id, clienteId }, data });
    if (result.count === 0) {
      throw new NotFoundException("Setor não encontrado.");
    }
    return this.prisma.setor.findFirst({ where: { id, clienteId } }) as Promise<Setor>;
  }

  async delete(id: string, clienteId: string): Promise<void> {
    const result = await this.prisma.setor.deleteMany({ where: { id, clienteId } });
    if (result.count === 0) {
      throw new NotFoundException("Setor não encontrado.");
    }
  }
}
