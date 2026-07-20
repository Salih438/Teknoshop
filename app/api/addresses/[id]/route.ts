import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) return NextResponse.json({ error: "Giriş yapmalısınız" }, { status: 401 });

    // 🚀 OPTİMİZASYON: Sadece 'id' alanını çekiyoruz (Gereksiz veri çekimini engelledik)
    const dbUser = await prisma.user.findUnique({
      where: { email: clerkUser.emailAddresses[0].emailAddress },
      select: { id: true } 
    });
    
    if (!dbUser) return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });

    const resolvedParams = await params;
    const addressId = resolvedParams.id;

    // GÜVENLİK DUVARI: Adres bu kullanıcıya mı ait? (IDOR Koruması)
    const address = await prisma.address.findUnique({ 
      where: { id: addressId },
      select: { userId: true } // 🚀 OPTİMİZASYON: Sadece sahiplik kontrolü için userId yeterli
    });
    
    if (!address || address.userId !== dbUser.id) {
      return NextResponse.json({ error: "Bu işlem için yetkiniz yok." }, { status: 403 });
    }

    // SİPARİŞ KONTROLÜ: Bu adrese bağlı verilmiş sipariş var mı kontrol et
    const orderCount = await prisma.order.count({
      where: { addressId: addressId }
    });

    if (orderCount > 0) {
      return NextResponse.json(
        { error: "Bu adres geçmiş veya aktif siparişlerinizde kullanıldığı için silinemez." }, 
        { status: 400 }
      );
    }

    // Eğer sipariş yoksa adresi güvenle sil
    await prisma.address.delete({
      where: { id: addressId },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Adres Silme Hatası:", error);
    return NextResponse.json({ error: "Adres silinirken bir hata oluştu." }, { status: 500 });
  }
}