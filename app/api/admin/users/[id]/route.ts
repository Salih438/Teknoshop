// app/api/admin/users/[id]/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // --- 1. GÜVENLİK DUVARI (Kimlik Doğrulama) ---
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "İşlem yapabilmek için giriş yapmalısınız." }, { status: 401 });
    }

    // --- 2. YETKİLENDİRME (Admin Rol Kontrolü) ---
    const email = clerkUser.emailAddresses[0].emailAddress;
    const dbUser = await prisma.user.findUnique({
      where: { email },
    });

    if (!dbUser || dbUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Bu işlem için yönetici yetkiniz bulunmuyor." }, { status: 403 });
    }
    // --- GÜVENLİK DUVARI BİTİŞİ ---

    // --- KONTROLLER GEÇİLDİ, İŞLEM BAŞLIYOR ---
    const resolvedParams = await params;
    const userId = resolvedParams.id;
    
    // Gelen veriyi (body) json olarak okuyoruz
    const body = await request.json();

    // Prisma ile kullanıcının Rolünü veya Aktif/Pasif durumunu güncelliyoruz
    // Mevcut yapındaki Mass Assignment koruması (güvenli güncelleme mantığı) korundu
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(body.role && { role: body.role }),
        ...(body.isActive !== undefined && { isActive: body.isActive })
      }
    });

    return NextResponse.json({ success: true, user: updatedUser }, { status: 200 });
  } catch (error) {
    // Sunucu ve veritabanı açıklarını maskeleyen güvenli hata loglaması
    console.error("GÜVENLİ LOGLAMA - Kullanıcı güncellenirken hata:", error);
    return NextResponse.json({ error: "İşlem başarısız oldu." }, { status: 500 });
  }
}