-- CreateEnum
CREATE TYPE "UserNotificationType" AS ENUM ('ORDER_CREATED', 'ORDER_PREPARING', 'ORDER_SHIPPED', 'ORDER_DELIVERED', 'RETURN_APPROVED', 'RETURN_REJECTED', 'RETURN_COMPLETED', 'EXCHANGE_APPROVED', 'EXCHANGE_REJECTED', 'EXCHANGE_RECEIVED', 'EXCHANGE_SHIPPED', 'EXCHANGE_COMPLETED', 'NEW_COUPON', 'NEW_CAMPAIGN', 'SYSTEM_ANNOUNCEMENT');

-- CreateTable
CREATE TABLE "UserNotification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "UserNotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "linkUrl" TEXT,
    "entityType" TEXT,
    "entityId" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserNotification_userId_isRead_createdAt_idx" ON "UserNotification"("userId", "isRead", "createdAt");

-- CreateIndex
CREATE INDEX "UserNotification_userId_createdAt_idx" ON "UserNotification"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "UserNotification_entityType_entityId_idx" ON "UserNotification"("entityType", "entityId");

-- AddForeignKey
ALTER TABLE "UserNotification" ADD CONSTRAINT "UserNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
