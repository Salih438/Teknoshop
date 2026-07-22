// app/api/admin/users/[id]/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

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
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    // Sunucu ve veritabanı açıklarını maskeleyen güvenli hata loglaması
    console.error("GÜVENLİ LOGLAMA - Kullanıcı güncellenirken hata:", error);
    return NextResponse.json({ error: "İşlem başarısız oldu." }, { status: 500 });
  }
}