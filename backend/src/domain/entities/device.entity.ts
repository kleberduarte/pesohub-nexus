export type DeviceStatus = "ONLINE" | "OFFLINE" | "NOT_CONFIGURED";

export class Device {
  id!: string;
  clienteId!: string;
  nome!: string;
  ip!: string;
  porta!: number;
  grupoId?: string | null;
  status!: DeviceStatus;
  ultimoAcesso?: Date | null;
  agentId?: string | null;
}
