import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "./prisma.service";
import { Operador } from "../../domain/entities/operador.entity";
import { OperadorRepository } from "../../domain/repositories/operador.repository";

@Injectable()
export class OperadorPrismaRepository implements OperadorRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(clienteId: string): Promise<Operador[]> {
    return this.prisma.operador.findMany({
      where: { clienteId },
      orderBy: { numero: "asc" },
    }) as unknown as Promise<Operador[]>;
  }

  findById(id: string, clienteId: string): Promise<Operador | null> {
    return this.prisma.operador.findFirst({ where: { id, clienteId } }) as unknown as Promise<Operador | null>;
  }

  async create(data: Omit<Operador, "id">): Promise<Operador> {
    try {
      return (await this.prisma.operador.create({
        data: data as unknown as Prisma.OperadorUncheckedCreateInput,
      })) as unknown as Operador;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new ConflictException("Já existe um operador com este número.");
      }
      throw err;
    }
  }

  async update(id: string, clienteId: string, data: Partial<Operador>): Promise<Operador> {
    const result = await this.prisma.operador.updateMany({
      where: { id, clienteId },
      data: data as unknown as Prisma.OperadorUncheckedUpdateManyInput,
    });
    if (result.count === 0) {
      throw new NotFoundException("Operador não encontrado.");
    }
    return this.prisma.operador.findFirst({ where: { id, clienteId } }) as unknown as Promise<Operador>;
  }

  async delete(id: string, clienteId: string): Promise<void> {
    const result = await this.prisma.operador.deleteMany({ where: { id, clienteId } });
    if (result.count === 0) {
      throw new NotFoundException("Operador não encontrado.");
    }
  }
}
