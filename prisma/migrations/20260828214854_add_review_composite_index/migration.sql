-- CreateIndex
CREATE INDEX "Review_productId_isHidden_createdAt_idx" ON "Review"("productId", "isHidden", "createdAt");
