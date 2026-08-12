import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "./prisma.service";
import { Setor } from "../../domain/entities/setor.entity";
import { SetorRepository } from "../../domain/repositories/setor.repository";

@Injectable()
export class SetorPrismaRepository implements SetorRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(lojaId: string): Promise<Setor[]> {
    return this.prisma.setor.findMany({ where: { lojaId }, orderBy: { numero: "asc" } });
  }

  findById(id: string, lojaId: string): Promise<Setor | null> {
    return this.prisma.setor.findFirst({ where: { id, lojaId } });
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

  async update(id: string, lojaId: string, data: Partial<Setor>): Promise<Setor> {
    const result = await this.prisma.setor.updateMany({ where: { id, lojaId }, data });
    if (result.count === 0) {
      throw new NotFoundException("Setor não encontrado.");
    }
    return this.prisma.setor.findFirst({ where: { id, lojaId } }) as Promise<Setor>;
  }

  async delete(id: string, lojaId: string): Promise<void> {
    const result = await this.prisma.setor.deleteMany({ where: { id, lojaId } });
    if (result.count === 0) {
      throw new NotFoundException("Setor não encontrado.");
    }
  }
}
