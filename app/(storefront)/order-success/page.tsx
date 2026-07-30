import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Image from "next/image";
import OrderTimeline from "@/components/orders/OrderTimeline";

export const dynamic = "force-dynamic";

export default async function OrderSuccessPage({ searchParams }: { searchParams: Promise<{ orderId?: string }> }) {
  const resolvedParams = await searchParams;
  const orderId = resolvedParams.orderId;

  if (!orderId) {
    return (
      <div className="min-h-[80vh] bg-white flex flex-col items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-gray-100 p-8 text-center space-y-4">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto text-3xl">
            ⚠️
          </div>
          <h1 className="text-2xl font-black text-gray-900">Sipariş Bulunamadı</h1>
          <p className="text-gray-500 text-xs">Lütfen sipariş numaranızı kontrol edin veya destek ekibimizle iletişime geçin.</p>
          <Link href="/" className="inline-flex items-center justify-center bg-blue-600 text-white font-extrabold px-6 py-3 rounded-2xl text-xs">
            Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    );
  }

  const clerkUser = await currentUser();
  if (!clerkUser) redirect("/");

  const email = clerkUser.emailAddresses[0]?.emailAddress;
  if (!email) redirect("/");

  const dbUser = await prisma.user.findUnique({ where: { email } });
  if (!dbUser) redirect("/");

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: true,
        },
      },
      address: true,
      payment: {
        include: {
          paymentMethod: true,
        },
      },
      shipment: true,
    },
  });

  if (!order || order.userId !== dbUser.id) {
    return (
      <div className="min-h-[80vh] bg-white flex flex-col items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-gray-100 p-8 text-center space-y-4">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto text-3xl">
            🔒
          </div>
          <h1 className="text-2xl font-black text-gray-900">Yetkisiz Erişim</h1>
          <p className="text-gray-500 text-xs">Bu siparişi görüntüleme yetkiniz bulunmamaktadır.</p>
          <Link href="/" className="inline-flex items-center justify-center bg-blue-600 text-white font-extrabold px-6 py-3 rounded-2xl text-xs">
            Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    );
  }

  const shortOrderNumber = `#ORD-${order.id.slice(-8).toUpperCase()}`;

  return (
    <div className="min-h-screen bg-gray-50/50 py-10 px-4 w-full overflow-x-clip text-left">
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
        
        {/* 🚀 APPLE STORE TEBRİK KARTI */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-gray-200 shadow-xl text-center space-y-4 relative overflow-hidden">
          <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto text-4xl shadow-inner animate-bounce">
            🎉
          </div>
          <span className="bg-green-100 text-green-800 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full inline-block">
            ✓ SİPARİŞİNİZ BAŞARIYLA ALINDI
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-gray-900 tracking-tight">Tebrikler, Siparişiniz Hazırlanıyor!</h1>
          <p className="text-gray-500 text-xs sm:text-sm max-w-xl mx-auto font-medium">
            Harika bir seçim! Siparişiniz onaylandı ve depo ekibimiz tarafından özenle paketlenmeye başlandı.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-gray-100 max-w-2xl mx-auto">
            <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
              <span className="text-[10px] text-gray-400 font-bold block uppercase">Sipariş Kodu</span>
              <span className="font-mono font-black text-blue-600 text-xs sm:text-sm">{shortOrderNumber}</span>
            </div>

            <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
              <span className="text-[10px] text-gray-400 font-bold block uppercase">Toplam Tutar</span>
              <span className="font-black text-gray-900 text-xs sm:text-sm">{order.totalPrice.toLocaleString("tr-TR")} ₺</span>
            </div>

            <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
              <span className="text-[10px] text-gray-400 font-bold block uppercase">Ödeme Yöntemi</span>
              <span className="font-bold text-gray-800 text-xs truncate block">{order.payment?.paymentMethod?.name || "Kredi Kartı"}</span>
            </div>

            <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
              <span className="text-[10px] text-gray-400 font-bold block uppercase">Tahmini Teslimat</span>
              <span className="font-bold text-green-600 text-xs block">Yarın Kargoda</span>
            </div>
          </div>
        </div>

        {/* 🚀 TIMELINE HAREKET ZAMAN ÇİZELGESİ */}
        <OrderTimeline status={order.status} createdAt={order.createdAt} />

        {/* 🚀 SİPARİŞ EDİLEN ÜRÜNLER LİSTESİ */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-xs space-y-4">
          <h3 className="font-black text-gray-900 text-base border-b border-gray-100 pb-3">
            Sipariş Edilen Ürünler ({order.items.length})
          </h3>

          <div className="divide-y divide-gray-100">
            {order.items.map((item) => (
              <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white rounded-xl border border-gray-100 p-1 flex-shrink-0 flex items-center justify-center">
                    {item.product?.imageUrl ? (
                      <Image src={item.product.imageUrl} alt={item.product.name} width={48} height={48} className="object-contain" />
                    ) : (
                      <span>📦</span>
                    )}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs sm:text-sm text-gray-900 line-clamp-1">{item.product?.name}</h4>
                    <span className="text-[10px] text-gray-400 font-bold">Adet: {item.quantity}</span>
                  </div>
                </div>

                <span className="font-black text-blue-600 text-xs sm:text-sm">
                  {(item.price * item.quantity).toLocaleString("tr-TR")} ₺
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 🚀 AKSİYON BUTONLARI */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link
            href="/profile"
            className="w-full sm:flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl text-xs sm:text-sm text-center transition shadow-md min-h-[48px] flex items-center justify-center gap-2"
          >
            <span>📋 Siparişlerimi Takip Et</span>
          </Link>

          <Link
            href="/products"
            className="w-full sm:flex-1 bg-white hover:bg-gray-50 border border-gray-200 text-gray-800 font-extrabold py-4 rounded-2xl text-xs sm:text-sm text-center transition min-h-[48px] flex items-center justify-center"
          >
            Alışverişe Devam Et ➔
          </Link>
        </div>

      </div>
    </div>
  );
}