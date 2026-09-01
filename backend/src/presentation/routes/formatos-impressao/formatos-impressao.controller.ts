import { Body, Controller, Delete, Get, HttpCode, Inject, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { Request } from "express";
import { CreateFormatoImpressaoDto } from "../../../application/dtos/create-formato-impressao.dto";
import { UpdateFormatoImpressaoDto } from "../../../application/dtos/update-formato-impressao.dto";
import {
  FORMATO_IMPRESSAO_REPOSITORY,
  FormatoImpressaoRepository,
} from "../../../domain/repositories/formato-impressao.repository";
import { PrismaService } from "../../../infrastructure/database/prisma.service";
import { JwtAuthGuard } from "../../middleware/jwt-auth.guard";

@ApiTags("formatos-impressao")
@UseGuards(JwtAuthGuard)
@Controller("formatos-impressao")
export class FormatosImpressaoController {
  constructor(
    @Inject(FORMATO_IMPRESSAO_REPOSITORY) private readonly formatos: FormatoImpressaoRepository,
    @InjectQueue("sync-jobs") private readonly syncQueue: Queue,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  findAll(@Req() req: Request) {
    return this.formatos.findAll(this.lojaId(req));
  }

  @Get(":id")
  findOne(@Param("id") id: string, @Req() req: Request) {
    return this.formatos.findById(id, this.lojaId(req));
  }

  @Post()
  async create(@Body() dto: CreateFormatoImpressaoDto, @Req() req: Request) {
    const criado = await this.formatos.create({
      ...dto,
      tipo: dto.tipo ?? 1,
      clienteId: this.clienteId(req),
      lojaId: this.lojaId(req),
    });
    const sincronizacao = await this.enfileirarSync(criado.id, this.lojaId(req));
    return { ...criado, sincronizacao };
  }

  @Patch(":id")
  async update(@Param("id") id: string, @Body() dto: UpdateFormatoImpressaoDto, @Req() req: Request) {
    const atualizado = await this.formatos.update(id, this.lojaId(req), dto);
    const sincronizacao = await this.enfileirarSync(id, this.lojaId(req));
    return { ...atualizado, sincronizacao };
  }

  @Delete(":id")
  @HttpCode(204)
  remove(@Param("id") id: string, @Req() req: Request) {
    return this.formatos.delete(id, this.lojaId(req));
  }

  /**
   * Gravar o layout no banco não mudava nada na balança: o bloco LAB só existia
   * como efeito colateral de uma sincronização de produtos, e o usuário não
   * recebia aviso nenhum. Agora salvar enfileira a sincronização das balanças
   * da loja, levando o formato junto (`formatoIds`) mesmo que nenhum produto o
   * use — e os produtos que o usam, para não desatualizar o vínculo.
   *
   * O retorno diz quantas balanças foram acionadas, para a tela poder informar
   * em vez de fingir que já chegou.
   */
  private async enfileirarSync(formatoId: string, lojaId: string) {
    const [devices, produtos] = await Promise.all([
      this.prisma.device.findMany({
        where: { lojaId, agentId: { not: null } },
        select: { id: true },
      }),
      this.prisma.product.findMany({
        where: { lojaId, ativo: true, formatoImpressaoId: formatoId },
        select: { id: true },
      }),
    ]);

    if (devices.length === 0) return { balancas: 0, produtos: produtos.length };

    const productIds = produtos.map((p) => p.id);
    await Promise.all(
      devices.map((d) =>
        this.syncQueue.add("sync-device", {
          deviceId: d.id,
          tipo: "INCREMENTAL",
          productIds,
          formatoIds: [formatoId],
        }),
      ),
    );

    return { balancas: devices.length, produtos: productIds.length };
  }

  private lojaId(req: Request): string {
    return (req as unknown as { user: { lojaId: string } }).user.lojaId;
  }

  private clienteId(req: Request): string {
    return (req as unknown as { user: { clienteId: string } }).user.clienteId;
  }
}
