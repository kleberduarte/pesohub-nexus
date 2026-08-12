import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "./prisma.service";
import { CodigoBarrasFormato } from "../../domain/entities/codigo-barras-formato.entity";
import { CodigoBarrasFormatoRepository } from "../../domain/repositories/codigo-barras-formato.repository";

@Injectable()
export class CodigoBarrasFormatoPrismaRepository implements CodigoBarrasFormatoRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(lojaId: string): Promise<CodigoBarrasFormato[]> {
    return this.prisma.codigoBarrasFormato.findMany({
      where: { lojaId },
      orderBy: { numero: "asc" },
    }) as unknown as Promise<CodigoBarrasFormato[]>;
  }

  findById(id: string, lojaId: string): Promise<CodigoBarrasFormato | null> {
    return this.prisma.codigoBarrasFormato.findFirst({
      where: { id, lojaId },
    }) as unknown as Promise<CodigoBarrasFormato | null>;
  }

  async create(data: Omit<CodigoBarrasFormato, "id">): Promise<CodigoBarrasFormato> {
    try {
      return (await this.prisma.codigoBarrasFormato.create({
        data: data as unknown as Prisma.CodigoBarrasFormatoUncheckedCreateInput,
      })) as unknown as CodigoBarrasFormato;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new ConflictException("Já existe um formato de código de barras com este número.");
      }
      throw err;
    }
  }

  async update(id: string, lojaId: string, data: Partial<CodigoBarrasFormato>): Promise<CodigoBarrasFormato> {
    const result = await this.prisma.codigoBarrasFormato.updateMany({
      where: { id, lojaId },
      data: data as unknown as Prisma.CodigoBarrasFormatoUncheckedUpdateManyInput,
    });
    if (result.count === 0) {
      throw new NotFoundException("Formato de código de barras não encontrado.");
    }
    return this.prisma.codigoBarrasFormato.findFirst({
      where: { id, lojaId },
    }) as unknown as Promise<CodigoBarrasFormato>;
  }

  async delete(id: string, lojaId: string): Promise<void> {
    const result = await this.prisma.codigoBarrasFormato.deleteMany({ where: { id, lojaId } });
    if (result.count === 0) {
      throw new NotFoundException("Formato de código de barras não encontrado.");
    }
  }
}
