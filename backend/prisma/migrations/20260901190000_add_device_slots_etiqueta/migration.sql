-- Mapa de slots de etiqueta (LAB) ocupados em cada balança, reportado pelo
-- Agent Local. Nullable de propósito: device sem agent, ou cuja leitura ainda
-- não aconteceu, fica com NULL — que a aplicação lê como "não sei", nunca como
-- "nada ocupado". Ver card #55.
ALTER TABLE "Device" ADD COLUMN "slotsEtiqueta" JSONB;
ALTER TABLE "Device" ADD COLUMN "slotsEtiquetaLidosEm" TIMESTAMP(3);
