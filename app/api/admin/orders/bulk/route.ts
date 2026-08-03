import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth";
import { isStatusTransitionAllowed } from "@/lib/constants/order-status";
import { OrderService } from "@/lib/services/order.service";
import { AuditLogService } from "@/lib/services/audit-log.service";
import { AuditRiskLevel } from "@prisma/client";

export async function PATCH(request: Request) {
  try {
    await requireAdmin("MANAGE_ORDERS");

    const body = await request.json();
    const { orderIds, status } = body;

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json({ error: "Lütfen en az bir sipariş seçiniz." }, { status: 400 });
    }

    const allowedStatuses = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];
    if (!allowedStatuses.includes(status)) {
      return NextResponse.json({ error: "Geçersiz sipariş durumu." }, { status: 400 });
    }

    let updatedCount = 0;

    if (status === "CANCELLED") {
      const existingOrders = await prisma.order.findMany({
        where: { id: { in: orderIds } },
        select: { id: true, status: true },
      });

      for (const order of existingOrders) {
        if (!isStatusTransitionAllowed(order.status, status)) {
          throw new Error(`INVALID_TRANSITION:${order.status}:${status}:${order.id}`);
        }
      }

      for (const id of orderIds) {
        const res = await OrderService.cancelOrder(id);
        if (!res.alreadyCancelled) {
          updatedCount++;
        }
      }
    } else {
      await prisma.$transaction(async (tx) => {
        const existingOrders = await tx.order.findMany({
          where: { id: { in: orderIds } },
          select: { id: true, status: true },
        });

        for (const order of existingOrders) {
          if (!isStatusTransitionAllowed(order.status, status)) {
            throw new Error(`INVALID_TRANSITION:${order.status}:${status}:${order.id}`);
          }
        }

        if (status === "DELIVERED") {
          await tx.order.updateMany({
            where: {
              id: { in: orderIds },
              status: { not: "DELIVERED" },
            },
            data: {
              deliveredAt: new Date(),
            },
          });
        }

        // Toplu güncelleme
        const result = await tx.order.updateMany({
          where: {
            id: { in: orderIds },
          },
          data: {
            status,
          },
        });
        updatedCount = result.count;
      });
    }

    // 🛡️ DENETİM İZİ (Audit Log)
    await AuditLogService.createAuditLog({
      action: "BULK_ORDER_STATUS_UPDATE",
      entityType: "Order",
      riskLevel: status === "CANCELLED" ? AuditRiskLevel.HIGH : AuditRiskLevel.MEDIUM,
      newValue: { count: updatedCount, newStatus: status, orderIds },
    });

    return NextResponse.json(
      { success: true, count: updatedCount, message: `${updatedCount} sipariş güncellendi.` },
      { status: 200 }
    );
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "";
    if (message.startsWith("INVALID_TRANSITION:")) {
      const parts = message.split(":");
      const currentStatus = parts[1];
      const targetStatus = parts[2];
      const orderId = parts[3];
      const shortId = orderId ? `#ORD-${orderId.slice(-8).toUpperCase()}` : "";
      return NextResponse.json(
        { error: `${currentStatus} durumundaki sipariş ${shortId} ${targetStatus} durumuna geçirilemez.` },
        { status: 400 }
      );
    }
    console.error("Bulk order update error:", error);
    return NextResponse.json(
      { error: "Toplu güncelleme sırasında bir hata oluştu." },
      { status: 500 }
    );
  }
}
