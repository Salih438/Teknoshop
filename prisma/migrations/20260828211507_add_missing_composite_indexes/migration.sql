-- CreateIndex
CREATE INDEX "Coupon_isActive_expireDate_idx" ON "Coupon"("isActive", "expireDate");

-- CreateIndex
CREATE INDEX "Order_status_createdAt_idx" ON "Order"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Product_isActive_price_idx" ON "Product"("isActive", "price");

-- CreateIndex
CREATE INDEX "Product_isActive_salesCount_idx" ON "Product"("isActive", "salesCount");
