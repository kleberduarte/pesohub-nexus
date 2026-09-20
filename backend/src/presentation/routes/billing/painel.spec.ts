import { ForbiddenException } from "@nestjs/common";
import { PainelService, situacaoDaAssinatura } from "./painel.service";

/**
 * Card #98 — painel financeiro do PesoHub. O que se protege: ninguém além do
 * administrador do produto vê a base inteira, e os números do topo não podem
 * misturar receita contratada com dinheiro recebido.
 */
describe("situacaoDaAssinatura", () => {
  const agora = new Date("2026-09-20T12:00:00Z");

  it("recém-contratada aparece como aguardando pagamento", () => {
    expect(situacaoDaAssinatura("TRIAL", null, agora)).toBe("AGUARDANDO");
  });

  it("em dia é ativa", () => {
    expect(situacaoDaAssinatura("ATIVA", new Date("2026-10-10"), agora)).toBe("ATIVA");
  });

  it("atrasada dentro da carência ainda não está bloqueada", () => {
    expect(situacaoDaAssinatura("INADIMPLENTE", new Date("2026-09-16"), agora)).toBe("ATRASADA");
  });

  it("passada a carência, aparece como bloqueada", () => {
    expect(situacaoDaAssinatura("INADIMPLENTE", new Date("2026-09-01"), agora)).toBe("BLOQUEADA");
  });

  it("cancelada é cancelada", () => {
    expect(situacaoDaAssinatura("CANCELADA", null, agora)).toBe("CANCELADA");
  });
});

describe("PainelService", () => {
  const agora = new Date("2026-09-20T12:00:00Z");

  function montar(over: Record<string, unknown> = {}) {
    const prisma = {
      user: { findUnique: jest.fn().mockResolvedValue({ role: "SUPERADMIN", clienteId: null }) },
      assinatura: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: "a1",
            clienteId: "ramuza",
            dominioRede: "davo.com.br",
            status: "ATIVA",
            formaPagamento: "PIX",
            valorUnitario: 40,
            quantidadeMinima: 1,
            quantidadeBalancas: 2,
            valor: 80,
            proximoVencimento: new Date("2026-10-05"),
            cliente: { id: "ramuza", nome: "Ramuza" },
            faturas: [
              {
                valor: 80,
                status: "RECEBIDA",
                dataVencimento: new Date("2026-09-05"),
                dataPagamento: new Date("2026-09-04"),
                linkPagamento: "https://asaas/f1",
              },
            ],
          },
          {
            id: "a2",
            clienteId: "ramuza",
            dominioRede: "redeavo.com.br",
            status: "INADIMPLENTE",
            formaPagamento: "BOLETO",
            valorUnitario: 40,
            quantidadeMinima: 1,
            quantidadeBalancas: 1,
            valor: 40,
            proximoVencimento: new Date("2026-09-01"),
            cliente: { id: "ramuza", nome: "Ramuza" },
            faturas: [],
          },
        ]),
      },
      contratoLicenciamento: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: "c1",
            clienteId: "ramuza",
            valorUnitario: 40,
            quantidadeMinima: 400,
            diaVencimento: 10,
            asaasCustomerId: "cus_1",
            ativo: true,
            cliente: { id: "ramuza", nome: "Ramuza" },
            competencias: [
              {
                id: "f1",
                competencia: "2026-08",
                quantidadeApurada: 10,
                quantidadeFaturada: 400,
                valorTotal: 16000,
                status: "PAGA",
                dataVencimento: new Date("2026-09-10"),
                dataPagamento: new Date("2026-09-08"),
                linkPagamento: null,
              },
              {
                id: "f2",
                competencia: "2026-07",
                quantidadeApurada: 8,
                quantidadeFaturada: 400,
                valorTotal: 16000,
                status: "VENCIDA",
                dataVencimento: new Date("2026-08-10"),
                dataPagamento: null,
                linkPagamento: null,
              },
            ],
          },
        ]),
      },
      device: {
        // Uma consulta agrupada por loja e outra por empresa (sem N+1).
        groupBy: jest.fn(({ by }) =>
          Promise.resolve(
            by[0] === "lojaId"
              ? [{ lojaId: "davo-1", _count: { _all: 3 } }, { lojaId: "avo-1", _count: { _all: 1 } }]
              : [{ clienteId: "ramuza", _count: { _all: 4 } }],
          ),
        ),
      },
      loja: {
        findMany: jest.fn().mockResolvedValue([
          { id: "davo-1", clienteId: "ramuza", dominioEmail: "davo.com.br" },
          { id: "avo-1", clienteId: "ramuza", dominioEmail: "redeavo.com.br" },
        ]),
      },
      ...over,
    };
    return { servico: new PainelService(prisma as never), prisma };
  }

  it("recusa quem não é o administrador do produto", async () => {
    const { servico } = montar({
      user: { findUnique: jest.fn().mockResolvedValue({ role: "ADMIN", clienteId: "ramuza" }) },
    });
    await expect(servico.exigirSuperadminGlobal("u1")).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("recusa SUPERADMIN preso a uma empresa", async () => {
    const { servico } = montar({
      user: { findUnique: jest.fn().mockResolvedValue({ role: "SUPERADMIN", clienteId: "ramuza" }) },
    });
    await expect(servico.exigirSuperadminGlobal("u1")).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("lista as assinaturas com situação e a prévia pelas balanças de hoje", async () => {
    const { servico } = montar();
    const { assinaturas } = await servico.visaoGeral(agora);

    expect(assinaturas[0]).toMatchObject({
      empresa: "Ramuza",
      rede: "davo.com.br",
      situacao: "ATIVA",
      valor: 80,
      balancasHoje: 3,
      // 3 balanças hoje x R$ 40: a cobrança atual está defasada, e isso aparece.
      valorPrevisto: 120,
    });
    expect(assinaturas[1]).toMatchObject({ rede: "redeavo.com.br", situacao: "BLOQUEADA" });
  });

  it("separa receita prevista, atraso e recebido no mês", async () => {
    const { servico } = montar();
    const { resumo } = await servico.visaoGeral(agora);

    // Redes: 80 + 40. Contrato: mínimo de 400 x R$ 40 = 16.000.
    expect(resumo).toMatchObject({
      mensalidadeRedes: 120,
      mensalidadeContratos: 16000,
      receitaMensalPrevista: 16120,
      // A rede atrasada (40) mais a competência vencida (16.000).
      emAtraso: 16040,
      // Competência paga em setembro.
      recebidoNoMes: 16000,
      assinaturasAtivas: 1,
      assinaturasEmAtraso: 1,
      contratosAtivos: 1,
    });
  });

  it("não chama o Asaas nem grava nada — é leitura pura", async () => {
    const { servico, prisma } = montar();
    await servico.visaoGeral(agora);
    expect(Object.keys(prisma.assinatura)).toEqual(["findMany"]);
    expect(Object.keys(prisma.contratoLicenciamento)).toEqual(["findMany"]);
    // Duas consultas agrupadas, e não uma contagem por linha.
    expect(prisma.device.groupBy).toHaveBeenCalledTimes(2);
  });
});
