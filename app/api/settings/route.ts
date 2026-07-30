import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, AuthError } from "@/lib/auth";
import { AuditLogService } from "@/lib/services/audit-log.service";
import { AuditRiskLevel } from "@prisma/client";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await prisma.storeSettings.findFirst();
    
    if (!settings) {
      return NextResponse.json({
        shippingCompany: "Yurtiçi Kargo",
        shippingFee: 149.99,
        freeShippingThreshold: 5000.00,
        phone: null,
        email: null,
        address: null,
        workingHours: null,
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Ayarlar çekilirken hata:", error);
    return NextResponse.json({ error: "Ayarlar getirilemedi" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    // 🛡️ GÜVENLİK: Granular RBAC Yetki Kontrolü (MANAGE_SETTINGS)
    const adminUser = await requireAdmin("MANAGE_SETTINGS");

    const body = await req.json();
    const { 
      shippingCompany, 
      shippingFee, 
      freeShippingThreshold,
      phone,
      email: storeEmail,
      address,
      workingHours
    } = body;

    const parsedFee = shippingFee !== undefined ? parseFloat(shippingFee) : undefined;
    const parsedThreshold = freeShippingThreshold !== undefined ? parseFloat(freeShippingThreshold) : undefined;

    // 🛡️ GİRDİ DOĞRULAMA: Kargo ücretleri ve barajları negatif olamaz!
    if ((parsedFee !== undefined && parsedFee < 0) || (parsedThreshold !== undefined && parsedThreshold < 0)) {
      return NextResponse.json({ error: "Kargo ücreti ve ücretsiz kargo barajı negatif olamaz." }, { status: 400 });
    }

    const existingSettings = await prisma.storeSettings.findFirst();
    const SETTINGS_ID = existingSettings?.id || "default-settings";

    const updatedSettings = await prisma.storeSettings.upsert({
      where: { id: SETTINGS_ID },
      update: {
        shippingCompany: shippingCompany !== undefined ? String(shippingCompany) : undefined,
        shippingFee: parsedFee,
        freeShippingThreshold: parsedThreshold,
        phone: phone !== undefined ? (phone || null) : undefined,
        email: storeEmail !== undefined ? (storeEmail || null) : undefined,
        address: address !== undefined ? (address || null) : undefined,
        workingHours: workingHours !== undefined ? (workingHours || null) : undefined,
      },
      create: {
        id: SETTINGS_ID,
        shippingCompany: String(shippingCompany || "Yurtiçi Kargo"),
        shippingFee: parsedFee ?? 149.99,
        freeShippingThreshold: parsedThreshold ?? 5000,
        phone: phone || null,
        email: storeEmail || null,
        address: address || null,
        workingHours: workingHours || null,
      },
    });

    // 🛡️ AUDIT LOG (STORE SETTINGS UPDATE)
    try {
      await AuditLogService.createAuditLog({
        adminId: adminUser.id,
        adminName: adminUser.name,
        adminEmail: adminUser.email,
        action: "STORE_SETTINGS_UPDATE",
        entityType: "StoreSettings",
        entityId: updatedSettings.id,
        entityName: "Mağaza Genel Ayarları",
        riskLevel: AuditRiskLevel.HIGH,
        oldValue: existingSettings ? {
          shippingCompany: existingSettings.shippingCompany,
          shippingFee: existingSettings.shippingFee,
          freeShippingThreshold: existingSettings.freeShippingThreshold,
          phone: existingSettings.phone,
          email: existingSettings.email,
        } : null,
        newValue: {
          shippingCompany: updatedSettings.shippingCompany,
          shippingFee: updatedSettings.shippingFee,
          freeShippingThreshold: updatedSettings.freeShippingThreshold,
          phone: updatedSettings.phone,
          email: updatedSettings.email,
        },
      });
    } catch (auditErr) {
      console.error("Audit log hatası (Mağaza Ayarları):", auditErr);
    }

    revalidatePath("/cart");
    revalidatePath("/checkout");
    revalidatePath("/contact");
    revalidatePath("/");
    revalidatePath("/admin/settings");

    return NextResponse.json({ success: true, settings: updatedSettings });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Ayarlar güncellenirken hata:", error);
    return NextResponse.json({ error: "Ayarlar güncellenemedi" }, { status: 500 });
  }
}
