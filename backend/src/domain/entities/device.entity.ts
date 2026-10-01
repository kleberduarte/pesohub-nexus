export type DeviceStatus = "ONLINE" | "OFFLINE" | "NOT_CONFIGURED";

export class Device {
  id!: string;
  clienteId!: string;
  lojaId!: string;
  nome!: string;
  ip!: string;
  porta!: number;
  grupoId?: string | null;
  status!: DeviceStatus;
  ultimoAcesso?: Date | null;
  agentId?: string | null;
  /** MAC lido pelo Agent Local; identifica a balança quando o DHCP troca o IP. */
  mac?: string | null;
  /** Última correção automática do IP pelo MAC. */
  ipAtualizadoEm?: Date | null;
}
