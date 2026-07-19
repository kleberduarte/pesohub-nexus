import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "./prisma.service";
import { TeclaAcessoRapido } from "../../domain/entities/tecla-acesso-rapido.entity";
import { TeclaAcessoRapidoRepository } from "../../domain/repositories/tecla-acesso-rapido.repository";

@Injectable()
export class TeclaAcessoRapidoPrismaRepository implements TeclaAcessoRapidoRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(clienteId: string): Promise<TeclaAcessoRapido[]> {
    return this.prisma.teclaAcessoRapido.findMany({
      where: { clienteId },
    }) as unknown as Promise<TeclaAcessoRapido[]>;
  }

  findById(id: string, clienteId: string): Promise<TeclaAcessoRapido | null> {
    return this.prisma.teclaAcessoRapido.findFirst({
      where: { id, clienteId },
    }) as unknown as Promise<TeclaAcessoRapido | null>;
  }

  async create(data: Omit<TeclaAcessoRapido, "id">): Promise<TeclaAcessoRapido> {
    return (await this.prisma.teclaAcessoRapido.create({
      data: data as unknown as Prisma.TeclaAcessoRapidoUncheckedCreateInput,
    })) as unknown as TeclaAcessoRapido;
  }

  async update(id: string, clienteId: string, data: Partial<TeclaAcessoRapido>): Promise<TeclaAcessoRapido> {
    const result = await this.prisma.teclaAcessoRapido.updateMany({
      where: { id, clienteId },
      data: data as unknown as Prisma.TeclaAcessoRapidoUncheckedUpdateManyInput,
    });
    if (result.count === 0) {
      throw new NotFoundException("Tecla de acesso rápido não encontrada.");
    }
    return this.prisma.teclaAcessoRapido.findFirst({
      where: { id, clienteId },
    }) as unknown as Promise<TeclaAcessoRapido>;
  }

  async delete(id: string, clienteId: string): Promise<void> {
    const result = await this.prisma.teclaAcessoRapido.deleteMany({ where: { id, clienteId } });
    if (result.count === 0) {
      throw new NotFoundException("Tecla de acesso rápido não encontrada.");
    }
  }
}
