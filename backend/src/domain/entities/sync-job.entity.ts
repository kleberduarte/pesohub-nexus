export type SyncJobType = "TOTAL" | "INCREMENTAL";
export type SyncJobStatus = "PENDING" | "IN_PROGRESS" | "SUCCESS" | "ERROR";

export class SyncJob {
  id!: string;
  deviceId!: string;
  status!: SyncJobStatus;
  tipo!: SyncJobType;
  iniciadoEm?: Date | null;
  concluidoEm?: Date | null;
  erro?: string | null;
}
