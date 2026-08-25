-- Prevent duplicate Device rows for the same IP within a loja (was possible via
-- manual "+ Adicionar" and "Buscar na Rede" auto-add, since neither the frontend
-- nor the backend deduplicated by IP before this).
CREATE UNIQUE INDEX "Device_lojaId_ip_key" ON "Device"("lojaId", "ip");
