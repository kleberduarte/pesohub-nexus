import { Injectable } from "@nestjs/common";
import { PrismaService } from "./prisma.service";
import { SpecParametro } from "../../domain/entities/spec-parametro.entity";
import { SpecParametroRepository } from "../../domain/repositories/spec-parametro.repository";

@Injectable()
export class SpecParametroPrismaRepository implements SpecParametroRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(lojaId: string): Promise<SpecParametro[]> {
    return this.prisma.specParametro.findMany({ where: { lojaId }, orderBy: { numero: "asc" } });
  }

  upsert(clienteId: string, lojaId: string, numero: number, valor: string): Promise<SpecParametro> {
    return this.prisma.specParametro.upsert({
      where: { lojaId_numero: { lojaId, numero } },
      create: { clienteId, lojaId, numero, valor },
      update: { valor },
    });
  }
}
