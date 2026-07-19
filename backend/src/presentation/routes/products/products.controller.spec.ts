import "reflect-metadata";
import { Reflector } from "@nestjs/core";
import { HTTP_CODE_METADATA } from "@nestjs/common/constants";
import { ProductsController } from "./products.controller";
import { DevicesController } from "../devices/devices.controller";
import { SetoresController } from "../setores/setores.controller";
import { SubSetoresController } from "../sub-setores/sub-setores.controller";
import { FornecedoresController } from "../fornecedores/fornecedores.controller";
import { AlergicosController } from "../alergicos/alergicos.controller";
import { TabelasNutricionaisController } from "../tabelas-nutricionais/tabelas-nutricionais.controller";
import { OperadoresController } from "../operadores/operadores.controller";
import { ImagensController } from "../imagens/imagens.controller";
import { FormatosImpressaoController } from "../formatos-impressao/formatos-impressao.controller";
import { CodigosBarrasFormatoController } from "../codigos-barras-formato/codigos-barras-formato.controller";
import { TextosGlobaisController } from "../textos-globais/textos-globais.controller";
import { TeclasAcessoRapidoController } from "../teclas-acesso-rapido/teclas-acesso-rapido.controller";
import { ROLES_KEY } from "../../middleware/roles.decorator";

/**
 * DELETE sem @HttpCode(204) faz o Nest responder 200 com corpo vazio; o
 * frontend então tenta fazer JSON.parse("") na resposta e quebra, mostrando
 * "Não foi possível excluir o produto" mesmo quando a exclusão funcionou no
 * banco (ver lib/api.ts request()). Trava essa classe de bug para qualquer
 * endpoint DELETE que devolva void.
 */
describe("DELETE endpoints devolvem 204 (sem corpo)", () => {
  const reflector = new Reflector();

  it("ProductsController.remove", () => {
    const status = reflector.get(HTTP_CODE_METADATA, ProductsController.prototype.remove);
    expect(status).toBe(204);
  });

  it("DevicesController.remove", () => {
    const status = reflector.get(HTTP_CODE_METADATA, DevicesController.prototype.remove);
    expect(status).toBe(204);
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const novosCadastros: [string, any][] = [
    ["SetoresController", SetoresController],
    ["SubSetoresController", SubSetoresController],
    ["FornecedoresController", FornecedoresController],
    ["AlergicosController", AlergicosController],
    ["TabelasNutricionaisController", TabelasNutricionaisController],
    ["OperadoresController", OperadoresController],
    ["ImagensController", ImagensController],
    ["FormatosImpressaoController", FormatosImpressaoController],
    ["CodigosBarrasFormatoController", CodigosBarrasFormatoController],
    ["TextosGlobaisController", TextosGlobaisController],
    ["TeclasAcessoRapidoController", TeclasAcessoRapidoController],
  ];

  it.each(novosCadastros)("%s.remove", (_name, controller) => {
    const status = reflector.get(HTTP_CODE_METADATA, controller.prototype.remove);
    expect(status).toBe(204);
  });
});

describe("ProductsController.removeAll", () => {
  const reflector = new Reflector();

  it("é restrito a ADMIN/SUPERADMIN via RolesGuard", () => {
    const roles = reflector.get(ROLES_KEY, ProductsController.prototype.removeAll);
    expect(roles).toEqual(["ADMIN", "SUPERADMIN"]);
  });

  it("exclui apenas os produtos do cliente autenticado e audita a ação", async () => {
    const products = {
      deleteAll: jest.fn().mockResolvedValue(3),
    };
    const auditLog = { record: jest.fn().mockResolvedValue(undefined) };
    const controller = new ProductsController({} as any, {} as any, products as any, auditLog as any);

    const req = { user: { clienteId: "cliente-a", sub: "user-1" } } as any;
    const result = await controller.removeAll(req);

    expect(products.deleteAll).toHaveBeenCalledWith("cliente-a");
    expect(result).toEqual({ deleted: 3 });
    expect(auditLog.record).toHaveBeenCalledWith(req, "products.delete_all", { count: 3 });
  });
});
