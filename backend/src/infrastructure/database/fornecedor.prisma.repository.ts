import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "./prisma.service";
import { Fornecedor } from "../../domain/entities/fornecedor.entity";
import { FornecedorRepository } from "../../domain/repositories/fornecedor.repository";

@Injectable()
export class FornecedorPrismaRepository implements FornecedorRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(clienteId: string): Promise<Fornecedor[]> {
    return this.prisma.fornecedor.findMany({ where: { clienteId }, orderBy: { numero: "asc" } });
  }

  findById(id: string, clienteId: string): Promise<Fornecedor | null> {
    return this.prisma.fornecedor.findFirst({ where: { id, clienteId } });
  }

  async create(data: Omit<Fornecedor, "id">): Promise<Fornecedor> {
    try {
      return await this.prisma.fornecedor.create({ data });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new ConflictException("Já existe um fornecedor com este número.");
      }
      throw err;
    }
  }

  async update(id: string, clienteId: string, data: Partial<Fornecedor>): Promise<Fornecedor> {
    const result = await this.prisma.fornecedor.updateMany({ where: { id, clienteId }, data });
    if (result.count === 0) {
      throw new NotFoundException("Fornecedor não encontrado.");
    }
    return this.prisma.fornecedor.findFirst({ where: { id, clienteId } }) as Promise<Fornecedor>;
  }

  async delete(id: string, clienteId: string): Promise<void> {
    const result = await this.prisma.fornecedor.deleteMany({ where: { id, clienteId } });
    if (result.count === 0) {
      throw new NotFoundException("Fornecedor não encontrado.");
    }
  }
}
