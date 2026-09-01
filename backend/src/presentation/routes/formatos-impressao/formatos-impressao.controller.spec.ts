import { FormatosImpressaoController } from "./formatos-impressao.controller";

describe("FormatosImpressaoController — salvar dispara sincronização", () => {
  const req = { user: { lojaId: "loja-a", clienteId: "cliente-a" } } as any;

  function makeController(opts: { devices?: Array<{ id: string }>; produtos?: Array<{ id: string }> } = {}) {
    const formatos = {
      create: jest.fn().mockResolvedValue({ id: "f1", numero: 22, nome: "Etiqueta" }),
      update: jest.fn().mockResolvedValue({ id: "f1", numero: 22, nome: "Etiqueta" }),
      findAll: jest.fn(),
      findById: jest.fn(),
      delete: jest.fn(),
    };
    const queue = { add: jest.fn().mockResolvedValue({ id: "job-1" }) };
    const prisma = {
      device: { findMany: jest.fn().mockResolvedValue(opts.devices ?? [{ id: "device-1" }]) },
      product: { findMany: jest.fn().mockResolvedValue(opts.produtos ?? [{ id: "p1" }]) },
    };
    const controller = new FormatosImpressaoController(formatos as any, queue as any, prisma as any);
    return { controller, formatos, queue, prisma };
  }

  // A regressão que este teste trava: salvar o layout era escrita pura no banco
  // e a balança seguia com o layout antigo, sem aviso nenhum.
  it("enfileira sync das balanças da loja ao salvar o layout", async () => {
    const { controller, queue } = makeController();

    const resposta = await controller.update("f1", { layout: { elementos: [] } } as any, req);

    expect(queue.add).toHaveBeenCalledWith("sync-device", {
      deviceId: "device-1",
      tipo: "INCREMENTAL",
      productIds: ["p1"],
      formatoIds: ["f1"],
    });
    expect(resposta.sincronizacao).toEqual({ balancas: 1, produtos: 1 });
  });

  it("leva o formato mesmo quando nenhum produto o usa", async () => {
    const { controller, queue } = makeController({ produtos: [] });

    const resposta = await controller.update("f1", { nome: "Nova" } as any, req);

    expect(queue.add).toHaveBeenCalledWith(
      "sync-device",
      expect.objectContaining({ productIds: [], formatoIds: ["f1"] }),
    );
    expect(resposta.sincronizacao).toEqual({ balancas: 1, produtos: 0 });
  });

  it("não enfileira nada quando a loja não tem balança com agente, e diz isso", async () => {
    const { controller, queue } = makeController({ devices: [] });

    const resposta = await controller.create(
      { numero: 22, nome: "Etiqueta", larguraMm: 56, alturaMm: 40, layout: {} } as any,
      req,
    );

    expect(queue.add).not.toHaveBeenCalled();
    expect(resposta.sincronizacao).toEqual({ balancas: 0, produtos: 1 });
  });

  it("só considera balanças da própria loja e com Agent Local vinculado", async () => {
    const { controller, prisma } = makeController();

    await controller.update("f1", { nome: "x" } as any, req);

    expect(prisma.device.findMany).toHaveBeenCalledWith({
      where: { lojaId: "loja-a", agentId: { not: null } },
      select: { id: true },
    });
    expect(prisma.product.findMany).toHaveBeenCalledWith({
      where: { lojaId: "loja-a", ativo: true, formatoImpressaoId: "f1" },
      select: { id: true },
    });
  });
});
