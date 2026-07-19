import { Controller, Get, NotFoundException, Param } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { PrismaService } from "../../../infrastructure/database/prisma.service";

@ApiTags("clientes-public")
@Controller("clientes")
export class ClientesPublicController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("acesso/:token")
  async acesso(@Param("token") token: string) {
    const cliente = await this.prisma.cliente.findUnique({
      where: { accessToken: token },
      select: { id: true, nome: true, logoUrl: true, corPrimaria: true, corSecundaria: true, tagline: true },
    });
    if (!cliente) {
      throw new NotFoundException("Link de acesso inválido.");
    }
    return cliente;
  }
}
