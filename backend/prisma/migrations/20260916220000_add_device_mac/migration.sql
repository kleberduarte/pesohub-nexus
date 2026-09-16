-- Card #79: a balança troca de IP (DHCP) ao religar. O MAC, lido pelo Agent
-- Local na tabela ARP, é o identificador estável usado para corrigir o IP
-- sozinho. Colunas opcionais: balanças já cadastradas aprendem o MAC na
-- primeira vez que aparecem no IP cadastrado.
ALTER TABLE "Device" ADD COLUMN "mac" TEXT;
ALTER TABLE "Device" ADD COLUMN "ipAtualizadoEm" TIMESTAMP(3);

-- Postgres permite vários NULL num índice único, então devices sem MAC não colidem.
CREATE UNIQUE INDEX "Device_lojaId_mac_key" ON "Device"("lojaId", "mac");
