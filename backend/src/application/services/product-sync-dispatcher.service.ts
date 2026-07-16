import { Inject, Injectable, Logger } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bull";
import { Queue } from "bull";
import { DEVICE_REPOSITORY, DeviceRepository } from "../../domain/repositories/device.repository";

/**
 * Dispara sync incremental automático para todo device com Agent Local vinculado,
 * evitando depender de chamada manual a POST /sync após criar/editar um produto.
 */
@Injectable()
export class ProductSyncDispatcher {
  private readonly logger = new Logger(ProductSyncDispatcher.name);

  constructor(
    @Inject(DEVICE_REPOSITORY) private readonly devices: DeviceRepository,
    @InjectQueue("sync-jobs") private readonly syncQueue: Queue,
  ) {}

  async syncToLinkedDevices(productId: string): Promise<void> {
    const devices = await this.devices.findAll();
    const linkedDevices = devices.filter((device) => !!device.agentId);

    if (linkedDevices.length === 0) {
      this.logger.warn(
        `Produto ${productId} salvo, mas nenhum device com Agent Local vinculado — sync não disparado.`,
      );
      return;
    }

    await Promise.all(
      linkedDevices.map((device) =>
        this.syncQueue.add("sync-device", {
          deviceId: device.id,
          tipo: "INCREMENTAL",
          productIds: [productId],
        }),
      ),
    );
  }
}
