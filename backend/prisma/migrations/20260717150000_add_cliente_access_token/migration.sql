ALTER TABLE "Cliente" ADD COLUMN "accessToken" TEXT;

UPDATE "Cliente" SET "accessToken" = md5(random()::text || clock_timestamp()::text || id) WHERE "accessToken" IS NULL;

ALTER TABLE "Cliente" ALTER COLUMN "accessToken" SET NOT NULL;

CREATE UNIQUE INDEX "Cliente_accessToken_key" ON "Cliente"("accessToken");
