import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "./prisma.service";
import { Alergico } from "../../domain/entities/alergico.entity";
import { AlergicoRepository } from "../../domain/repositories/alergico.repository";

@Injectable()
export class AlergicoPrismaRepository implements AlergicoRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(clienteId: string): Promise<Alergico[]> {
    return this.prisma.alergico.findMany({ where: { clienteId }, orderBy: { numero: "asc" } });
  }

  findById(id: string, clienteId: string): Promise<Alergico | null> {
    return this.prisma.alergico.findFirst({ where: { id, clienteId } });
  }

  async create(data: Omit<Alergico, "id">): Promise<Alergico> {
    try {
      return await this.prisma.alergico.create({ data });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new ConflictException("Já existe um alérgico com este número.");
      }
      throw err;
    }
  }

  async update(id: string, clienteId: string, data: Partial<Alergico>): Promise<Alergico> {
    const result = await this.prisma.alergico.updateMany({ where: { id, clienteId }, data });
    if (result.count === 0) {
      throw new NotFoundException("Alérgico não encontrado.");
    }
    return this.prisma.alergico.findFirst({ where: { id, clienteId } }) as Promise<Alergico>;
  }

  async delete(id: string, clienteId: string): Promise<void> {
    const result = await this.prisma.alergico.deleteMany({ where: { id, clienteId } });
    if (result.count === 0) {
      throw new NotFoundException("Alérgico não encontrado.");
    }
  }
}
