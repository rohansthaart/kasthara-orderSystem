CREATE TABLE "OrderSource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OrderSource_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OrderSource_name_key" ON "OrderSource"("name");

ALTER TABLE "Order" ADD COLUMN "sourceId" TEXT;
CREATE INDEX "Order_sourceId_idx" ON "Order"("sourceId");
ALTER TABLE "Order" ADD CONSTRAINT "Order_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "OrderSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "OrderSource" ("id", "name", "isActive", "updatedAt") VALUES
  ('facebook', 'Facebook', true, CURRENT_TIMESTAMP),
  ('instagram', 'Instagram', true, CURRENT_TIMESTAMP),
  ('whatsapp', 'WhatsApp', true, CURRENT_TIMESTAMP);
