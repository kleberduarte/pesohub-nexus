import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "./prisma.service";
import { ConfiguracaoAvancada } from "../../domain/entities/configuracao-avancada.entity";
import { ConfiguracaoAvancadaRepository } from "../../domain/repositories/configuracao-avancada.repository";

@Injectable()
export class ConfiguracaoAvancadaPrismaRepository implements ConfiguracaoAvancadaRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByCliente(clienteId: string): Promise<ConfiguracaoAvancada | null> {
    return this.prisma.configuracaoAvancada.findUnique({
      where: { clienteId },
    }) as unknown as Promise<ConfiguracaoAvancada | null>;
  }

  async upsert(
    clienteId: string,
    data: Partial<Omit<ConfiguracaoAvancada, "id" | "clienteId">>,
  ): Promise<ConfiguracaoAvancada> {
    return (await this.prisma.configuracaoAvancada.upsert({
      where: { clienteId },
      create: { clienteId, ...data } as unknown as Prisma.ConfiguracaoAvancadaUncheckedCreateInput,
      update: data as unknown as Prisma.ConfiguracaoAvancadaUncheckedUpdateInput,
    })) as unknown as ConfiguracaoAvancada;
  }
}
