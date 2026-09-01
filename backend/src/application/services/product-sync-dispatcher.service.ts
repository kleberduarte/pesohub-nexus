import { Inject, Injectable, Logger } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
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

  private static readonly DISPATCH_BATCH_SIZE = 500;

  async syncToLinkedDevices(productId: string, lojaId: string): Promise<void> {
    const linkedDeviceIds = await this.devices.findLinkedDeviceIds(lojaId);

    if (linkedDeviceIds.length === 0) {
      this.logger.warn(
        `Produto ${productId} salvo, mas nenhum device com Agent Local vinculado — sync não disparado.`,
      );
      return;
    }

    for (let i = 0; i < linkedDeviceIds.length; i += ProductSyncDispatcher.DISPATCH_BATCH_SIZE) {
      const batch = linkedDeviceIds.slice(i, i + ProductSyncDispatcher.DISPATCH_BATCH_SIZE);
      await Promise.all(
        batch.map((deviceId) =>
          this.syncQueue.add("sync-device", {
            deviceId,
            tipo: "INCREMENTAL",
            productIds: [productId],
          }),
        ),
      );
    }
  }
}
