/**
 * Adapter de protocolo TXT-MODE legado (SDK JHScale) sobre TCP/IP porta 33581.
 * Isola a comunicação com o Agent local — o restante do sistema não conhece o protocolo.
 * Stub: implementação real depende do Agent Local (Módulo 4) e de acesso às balanças físicas.
 */
export interface ScaleSyncPayload {
  codigo: string;
  codigoBarras: string;
  nome: string;
  preco: number;
  categoriaImposto?: string;
}

export class ScaleProtocolAdapter {
  async sendProducts(deviceIp: string, devicePort: number, payload: ScaleSyncPayload[]): Promise<void> {
    throw new Error("Not implemented: depende do Agent Local (TCP porta 33581)");
  }
}
