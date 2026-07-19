import { BadRequestException, NotFoundException } from "@nestjs/common";
import { SyncController } from "./sync.controller";

describe("SyncController", () => {
  const makeReq = (clienteId: string) => ({ user: { clienteId, sub: "user-1" } }) as any;

  function makeController(devices: Record<string, { id: string }>) {
    const queue = { add: jest.fn().mockResolvedValue({ id: "job-1" }) };
    const deviceRepo = {
      findById: jest.fn((id: string, clienteId: string) =>
        Promise.resolve(devices[`${clienteId}:${id}`] ?? null),
      ),
    };
    const prisma = { syncJob: { findMany: jest.fn().mockResolvedValue([]) } };
    const auditLog = { record: jest.fn().mockResolvedValue(undefined) };
    const controller = new SyncController(queue as any, deviceRepo as any, prisma as any, auditLog as any);
    return { controller, queue, deviceRepo, auditLog };
  }

  it("rejeita sync para device que não pertence ao cliente autenticado", async () => {
    const { controller } = makeController({ "cliente-a:device-1": { id: "device-1" } });

    await expect(
      controller.create({ deviceIds: ["device-1"], tipo: "TOTAL" }, makeReq("cliente-b")),
    ).rejects.toThrow(BadRequestException);
  });

  it("enfileira e audita quando todos os devices pertencem ao cliente", async () => {
    const { controller, queue, auditLog } = makeController({
      "cliente-a:device-1": { id: "device-1" },
    });

    const result = await controller.create(
      { deviceIds: ["device-1"], tipo: "INCREMENTAL", productIds: ["p1"] },
      makeReq("cliente-a"),
    );

    expect(result.queued).toEqual(["job-1"]);
    expect(queue.add).toHaveBeenCalledWith("sync-device", {
      deviceId: "device-1",
      tipo: "INCREMENTAL",
      productIds: ["p1"],
    });
    expect(auditLog.record).toHaveBeenCalledWith(expect.anything(), "sync.trigger", expect.any(Object));
  });

  it("status lança NotFound se o device não pertence ao cliente", async () => {
    const { controller } = makeController({});

    await expect(controller.status("device-x", makeReq("cliente-a"))).rejects.toThrow(NotFoundException);
  });
});
