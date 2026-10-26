ALTER TABLE "Session" ADD COLUMN "tokenHash" TEXT;
UPDATE "Session" SET "tokenHash" = md5("id" || random()::text) WHERE "tokenHash" IS NULL;
ALTER TABLE "Session" ALTER COLUMN "tokenHash" SET NOT NULL;
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

ALTER TABLE "Product" ADD COLUMN "localName" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Product" ADD COLUMN "shortDescription" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Product" ADD COLUMN "rating" DOUBLE PRECISION NOT NULL DEFAULT 4.8;
ALTER TABLE "Product" ADD COLUMN "featured" BOOLEAN NOT NULL DEFAULT true;

CREATE UNIQUE INDEX "ProductVariant_productId_label_key" ON "ProductVariant"("productId", "label");
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "Payment_razorpayOrderId_idx" ON "Payment"("razorpayOrderId");
ALTER TABLE "Order" ADD COLUMN "expiresAt" TIMESTAMP(3);
CREATE INDEX "Order_status_expiresAt_idx" ON "Order"("status", "expiresAt");
ALTER TABLE "OtpCode" ADD COLUMN "ipHash" TEXT;
CREATE INDEX "OtpCode_ipHash_createdAt_idx" ON "OtpCode"("ipHash", "createdAt");
CREATE INDEX "OtpCode_identifier_createdAt_idx" ON "OtpCode"("identifier", "createdAt");
CREATE UNIQUE INDEX "NotificationOutbox_orderId_key" ON "NotificationOutbox"("orderId");
