import { AvisosCobrancaService } from "./avisos-cobranca.service";

/**
 * Card #100 — avisos de cobrança. O risco desta rotina é mandar e-mail demais
 * (cliente avisado vira cliente irritado) ou de menos (o silêncio é o problema
 * que o card veio resolver). Os testes travam exatamente isso: cada aviso sai
 * uma vez, o certo para cada momento da fatura, e uma falha de envio não
 * queima o aviso.
 */
const AGORA = new Date("2026-09-20T12:00:00.000Z");

function fatura(over: Record<string, unknown> = {}) {
  return {
    id: "fat_1",
    valor: 120,
    status: "PENDENTE",
    linkPagamento: "https://asaas.test/i/1",
    dataVencimento: new Date("2026-09-22T00:00:00.000Z"),
    avisoGeradaEm: null,
    avisoPreVencimento: null,
    avisoVencidaEm: null,
    assinatura: { clienteId: "cli_1", dominioRede: "davo.com.br" },
    ...over,
  };
}

function montar(faturasPorBusca: Record<string, unknown>[][], opcoes: { destinatarios?: string[] } = {}) {
  const chamadas = { findMany: [] as unknown[], updateMany: [] as unknown[], update: [] as unknown[] };
  let busca = 0;
  const prisma = {
    fatura: {
      findMany: jest.fn((args: unknown) => {
        chamadas.findMany.push(args);
        return Promise.resolve(faturasPorBusca[busca++] ?? []);
      }),
      updateMany: jest.fn((args: unknown) => {
        chamadas.updateMany.push(args);
        return Promise.resolve({ count: 1 });
      }),
      update: jest.fn((args: unknown) => {
        chamadas.update.push(args);
        return Promise.resolve({});
      }),
    },
    user: {
      findMany: jest.fn(() =>
        Promise.resolve((opcoes.destinatarios ?? ["gerente@davo.com.br"]).map((email) => ({ email }))),
      ),
    },
  };
  const enviar = jest.fn(
    (_entrada: { para: string; assunto: string; conteudo: { titulo: string; paragrafos: string[] } }) =>
      Promise.resolve({ id: "email_1" }),
  );
  const email = { configurado: true, enviar };
  const config = { get: jest.fn(() => "http://localhost:3001") };

  const service = new AvisosCobrancaService(
    prisma as never,
    email as never,
    config as never,
  );
  return { service, prisma, email, chamadas };
}

it("manda o aviso de fatura gerada e marca a coluna correspondente", async () => {
  const { service, email, chamadas } = montar([[fatura()], [], []]);

  const resumo = await service.rodar(AGORA);

  expect(resumo.porTipo.GERADA).toBe(1);
  expect(email.enviar).toHaveBeenCalledTimes(1);
  expect(email.enviar.mock.calls[0]?.[0]).toMatchObject({ para: "gerente@davo.com.br" });
  expect(chamadas.updateMany[0]).toMatchObject({
    where: { id: "fat_1", avisoGeradaEm: null },
    data: { avisoGeradaEm: AGORA },
  });
});

it("marca antes de enviar, para duas instâncias não mandarem o mesmo aviso", async () => {
  const { service, prisma, email } = montar([[fatura()], [], []]);
  // Outra instância chegou primeiro: a reserva não encontra mais a coluna nula.
  prisma.fatura.updateMany.mockResolvedValueOnce({ count: 0 });

  const resumo = await service.rodar(AGORA);

  expect(email.enviar).not.toHaveBeenCalled();
  expect(resumo.enviados).toBe(0);
});

it("desmarca a coluna quando o envio falha, para a próxima rodada tentar de novo", async () => {
  const { service, email, chamadas } = montar([[fatura()], [], []]);
  email.enviar.mockRejectedValueOnce(new Error("Resend fora do ar"));

  const resumo = await service.rodar(AGORA);

  expect(resumo.falhas).toBe(1);
  expect(resumo.enviados).toBe(0);
  expect(chamadas.update[0]).toMatchObject({ where: { id: "fat_1" }, data: { avisoGeradaEm: null } });
});

it("o aviso de pré-vencimento só olha o que vence dentro da janela e ainda não venceu", async () => {
  const { service, chamadas } = montar([[], [], []]);

  await service.rodar(AGORA);

  // Segunda busca é a do pré-vencimento.
  expect(chamadas.findMany[1]).toMatchObject({
    where: { avisoPreVencimento: null, dataVencimento: { gt: AGORA } },
  });
  const janela = (chamadas.findMany[1] as { where: { dataVencimento: { lte: Date } } }).where.dataVencimento.lte;
  expect(janela.getTime() - AGORA.getTime()).toBe(3 * 24 * 60 * 60 * 1000);
});

it("o aviso de vencida diz a data em que o bloqueio começa e que a balança continua funcionando", async () => {
  const vencimento = new Date("2026-09-10T00:00:00.000Z");
  const { service, email } = montar([[], [], [fatura({ status: "VENCIDA", dataVencimento: vencimento })]]);

  await service.rodar(AGORA);

  const texto = (email.enviar.mock.calls[0]?.[0].conteudo.paragrafos ?? []).join(" ");
  // 10/09 + 7 dias de carência = 17/09.
  expect(texto).toContain("17/09/2026");
  expect(texto).toContain("continuam pesando e imprimindo");
});

it("não envia nem marca quando a rede não tem Administrador da loja para avisar", async () => {
  const { service, email, chamadas } = montar([[fatura()], [], []], { destinatarios: [] });

  const resumo = await service.rodar(AGORA);

  expect(email.enviar).not.toHaveBeenCalled();
  expect(chamadas.updateMany).toHaveLength(0);
  expect(resumo.semDestinatario).toBe(1);
});

it("avisa todos os administradores da rede sobre a mesma fatura", async () => {
  const { service, email } = montar([[fatura()], [], []], {
    destinatarios: ["gerente@davo.com.br", "financeiro@davo.com.br"],
  });

  await service.rodar(AGORA);

  expect(email.enviar).toHaveBeenCalledTimes(2);
});
