-- Índices de performance: toda coluna usada como filtro de tenant (lojaId/clienteId)
-- ou como chave estrangeira estava sem índice, o que faz o Postgres varrer a tabela
-- inteira em cada listagem, heartbeat de agent e cascade de delete.

CREATE INDEX "Loja_clienteId_idx" ON "Loja"("clienteId");
CREATE INDEX "PerfilLojaAcesso_lojaId_idx" ON "PerfilLojaAcesso"("lojaId");
CREATE INDEX "Fatura_assinaturaId_idx" ON "Fatura"("assinaturaId");
CREATE INDEX "Device_clienteId_idx" ON "Device"("clienteId");
CREATE INDEX "Device_agentId_idx" ON "Device"("agentId");
CREATE INDEX "Device_grupoId_idx" ON "Device"("grupoId");
CREATE INDEX "Device_lojaId_status_idx" ON "Device"("lojaId", "status");
CREATE INDEX "DeviceGroup_lojaId_idx" ON "DeviceGroup"("lojaId");
CREATE INDEX "DeviceGroup_clienteId_idx" ON "DeviceGroup"("clienteId");
CREATE INDEX "Agent_clienteId_idx" ON "Agent"("clienteId");
CREATE INDEX "Agent_lojaId_idx" ON "Agent"("lojaId");
CREATE INDEX "SubSetor_setorId_idx" ON "SubSetor"("setorId");
CREATE INDEX "SubSetor_formatoImpressaoId_idx" ON "SubSetor"("formatoImpressaoId");
CREATE INDEX "SubSetor_codigoBarrasFormatoId_idx" ON "SubSetor"("codigoBarrasFormatoId");
CREATE INDEX "TabelaNutricionalItem_tabelaId_idx" ON "TabelaNutricionalItem"("tabelaId");
CREATE INDEX "Imagem_lojaId_idx" ON "Imagem"("lojaId");
CREATE INDEX "Imagem_clienteId_idx" ON "Imagem"("clienteId");
CREATE INDEX "TeclaAcessoRapido_lojaId_idx" ON "TeclaAcessoRapido"("lojaId");
CREATE INDEX "TeclaAcessoRapido_clienteId_idx" ON "TeclaAcessoRapido"("clienteId");
CREATE INDEX "ConfiguracaoAvancada_clienteId_idx" ON "ConfiguracaoAvancada"("clienteId");
CREATE INDEX "Product_clienteId_idx" ON "Product"("clienteId");
CREATE INDEX "Product_lojaId_ativo_idx" ON "Product"("lojaId", "ativo");
CREATE INDEX "Product_subSetorId_idx" ON "Product"("subSetorId");
CREATE INDEX "Product_tabelaNutricionalId_idx" ON "Product"("tabelaNutricionalId");
CREATE INDEX "Product_fornecedorId_idx" ON "Product"("fornecedorId");
CREATE INDEX "Product_alergicoId_idx" ON "Product"("alergicoId");
CREATE INDEX "Product_imagemId_idx" ON "Product"("imagemId");
CREATE INDEX "Product_formatoImpressaoId_idx" ON "Product"("formatoImpressaoId");
CREATE INDEX "Product_codigoBarrasFormatoId_idx" ON "Product"("codigoBarrasFormatoId");
CREATE INDEX "SyncJob_deviceId_id_idx" ON "SyncJob"("deviceId", "id");
CREATE INDEX "SyncJob_status_idx" ON "SyncJob"("status");
CREATE INDEX "SyncJobItem_jobId_idx" ON "SyncJobItem"("jobId");
CREATE INDEX "SyncJobItem_productId_idx" ON "SyncJobItem"("productId");
CREATE INDEX "User_clienteId_idx" ON "User"("clienteId");
CREATE INDEX "User_perfilId_idx" ON "User"("perfilId");
CREATE INDEX "User_activeClienteId_idx" ON "User"("activeClienteId");
CREATE INDEX "User_activeLojaId_idx" ON "User"("activeLojaId");
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");
CREATE INDEX "AuditLog_timestamp_idx" ON "AuditLog"("timestamp");
