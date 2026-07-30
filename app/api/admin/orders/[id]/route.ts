// app/api/admin/orders/[id]/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth";
import { EmailService } from "@/lib/email-service";
import { isStatusTransitionAllowed } from "@/lib/constants/order-status";
import { OrderService } from "@/lib/services/order.service";
import { AuditLogService } from "@/lib/services/audit-log.service";
import { AuditRiskLevel } from "@prisma/client";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin("MANAGE_ORDERS");

    const resolvedParams = await params;
    const orderId = resolvedParams.id;
    const body = await request.json();
    const { status, trackingNumber, company } = body;

    // 1. KARGO / TAKİP NUMARASI GÜNCELLEMESİ (Shipment Update)
    if (trackingNumber !== undefined || company !== undefined) {
      const existingShipment = await prisma.shipment.findUnique({
        where: { orderId },
      });

      if (existingShipment) {
        await prisma.shipment.update({
          where: { orderId },
          data: {
            ...(trackingNumber !== undefined ? { trackingNumber: trackingNumber ? trackingNumber.trim() : null } : {}),
            ...(company !== undefined ? { company: company ? company.trim() : "Yurtiçi Kargo" } : {}),
          },
        });
      } else {
        await prisma.shipment.create({
          data: {
            orderId,
            company: company ? company.trim() : "Yurtiçi Kargo",
            trackingNumber: trackingNumber ? trackingNumber.trim() : null,
          },
        });
      }

      if (!status) {
        const order = await prisma.order.findUnique({
          where: { id: orderId },
          include: { shipment: true },
        });

        // 🛡️ DENETİM İZİ (Audit Log)
        await AuditLogService.createAuditLog({
          action: "UPDATE_ORDER_TRACKING",
          entityType: "Order",
          entityId: orderId,
          entityName: `Sipariş #${orderId.slice(-8).toUpperCase()}`,
          riskLevel: AuditRiskLevel.LOW,
          newValue: { trackingNumber, company },
        });

        return NextResponse.json({ success: true, order }, { status: 200 });
      }
    }

    // 2. SİPARİŞ DURUMU GÜNCELLEMESİ (Status Update)
    if (status) {
      const allowedStatuses = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];
      if (!allowedStatuses.includes(status)) {
        return NextResponse.json(
          { error: "Geçersiz sipariş durumu girdisi." },
          { status: 400 }
        );
      }

      let updatedOrder;

      if (status === "CANCELLED") {
        const cancelRes = await OrderService.cancelOrder(orderId);
        updatedOrder = cancelRes.order;
      } else {
        updatedOrder = await prisma.$transaction(async (tx) => {
          const existingOrder = await tx.order.findUnique({
            where: { id: orderId },
          });

          if (!existingOrder) {
            throw new Error("NOT_FOUND");
          }

          if (!isStatusTransitionAllowed(existingOrder.status, status)) {
            throw new Error(`INVALID_TRANSITION:${existingOrder.status}:${status}`);
          }

          const isNewlyDelivered = status === "DELIVERED" && existingOrder.status !== "DELIVERED";

          const updated = await tx.order.update({
            where: { id: orderId },
            data: {
              status,
              ...(isNewlyDelivered ? { deliveredAt: new Date() } : {}),
            },
          });

          return updated;
        });
      }

      // Kargo E-postası Bildirimi (Durum SHIPPED olduğunda)
      if (status === "SHIPPED") {
        try {
          const orderWithDetails = await prisma.order.findUnique({
            where: { id: orderId },
            include: { user: true, shipment: true },
          });

          if (orderWithDetails?.user?.email) {
            await EmailService.sendOrderShippedEmail(
              orderWithDetails.id,
              orderWithDetails.user.email,
              orderWithDetails.user.name || "Müşteri",
              orderWithDetails.shipment?.trackingNumber || undefined,
              orderWithDetails.shipment?.company || undefined
            );
          }
        } catch (emailErr) {
          console.error("Kargo e-posta gönderme hatası:", emailErr);
        }
      }

      // 🛡️ DENETİM İZİ (Audit Log)
      await AuditLogService.createAuditLog({
        action: "UPDATE_ORDER_STATUS",
        entityType: "Order",
        entityId: orderId,
        entityName: `Sipariş #${orderId.slice(-8).toUpperCase()}`,
        riskLevel: AuditRiskLevel.MEDIUM,
        newValue: { status, trackingNumber, company },
      });

      return NextResponse.json({ success: true, order: updatedOrder }, { status: 200 });
    }

    return NextResponse.json({ error: "Güncellenecek veri sağlanmadı." }, { status: 400 });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error?.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Sipariş bulunamadı." }, { status: 404 });
    }
    if (typeof error?.message === "string" && error.message.startsWith("INVALID_TRANSITION:")) {
      const parts = error.message.split(":");
      const currentStatus = parts[1];
      const targetStatus = parts[2];
      return NextResponse.json(
        { error: `${currentStatus} durumundaki sipariş ${targetStatus} durumuna geçirilemez.` },
        { status: 400 }
      );
    }
    console.error("GÜVENLİ LOGLAMA - Sipariş Durumu Güncelleme Hatası:", error);
    return NextResponse.json(
      { error: "Sistemde bir hata oluştu, lütfen daha sonra tekrar deneyin." },
      { status: 500 }
    );
  }
}