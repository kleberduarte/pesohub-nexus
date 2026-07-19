import { Injectable } from "@nestjs/common";
import { PrismaService } from "./prisma.service";
import { SpecParametro } from "../../domain/entities/spec-parametro.entity";
import { SpecParametroRepository } from "../../domain/repositories/spec-parametro.repository";

@Injectable()
export class SpecParametroPrismaRepository implements SpecParametroRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(clienteId: string): Promise<SpecParametro[]> {
    return this.prisma.specParametro.findMany({ where: { clienteId }, orderBy: { numero: "asc" } });
  }

  upsert(clienteId: string, numero: number, valor: string): Promise<SpecParametro> {
    return this.prisma.specParametro.upsert({
      where: { clienteId_numero: { clienteId, numero } },
      create: { clienteId, numero, valor },
      update: { valor },
    });
  }
}
