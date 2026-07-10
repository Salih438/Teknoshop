// app/admin/orders/[id]/page.tsx
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import OrderStatusSelect from "../OrderStatusSelect";

export const dynamic = "force-dynamic";

export default async function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const orderId = resolvedParams.id;

  // Siparişi tüm detaylarıyla (müşteri, adres ve içindeki ürünler) çekiyoruz
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: true,
      items: {
        include: {
          product: {
            include: { images: true } // Ürün resimlerini de alıyoruz
          }
        }
      }
    }
  });

  if (!order) {
    redirect("/admin/orders");
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* ÜST KISIM: Geri Dönüş ve Başlık */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <Link href="/admin/orders" className="text-sm text-gray-500 hover:text-blue-600 transition flex items-center gap-2 mb-2">
            ← Siparişlere Dön
          </Link>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            Sipariş Detayı 
            <span className="text-sm font-mono bg-gray-200 text-gray-700 px-3 py-1 rounded-full">#{order.id.substring(0, 8).toUpperCase()}</span>
          </h1>
          <p className="text-gray-500 mt-1">Tarih: {new Date(order.createdAt).toLocaleString("tr-TR")}</p>
        </div>
        <div>
          <OrderStatusSelect orderId={order.id} currentStatus={order.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* SOL TARAF: Sipariş Edilen Ürünler (2 Birim) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">📦 Satın Alınan Ürünler</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {order.items.map((item) => {
                const mainImage = item.product?.images?.[0]?.imageUrl;
                return (
                  <div key={item.id} className="p-6 flex items-center gap-6">
                    <div className="w-20 h-20 bg-gray-50 border border-gray-200 rounded-lg overflow-hidden flex items-center justify-center">
                      {mainImage ? (
                        <img src={mainImage} alt={item.product.name} className="max-w-full max-h-full object-cover" />
                      ) : (
                        <span className="text-xl">📷</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-lg">{item.product?.name || "Silinmiş Ürün"}</h3>
                      <p className="text-sm text-gray-500 mt-1">Birim Fiyat: {item.price.toLocaleString("tr-TR")} ₺</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500 mb-1">Adet: <span className="font-bold text-gray-900">{item.quantity}</span></p>
                      <p className="font-bold text-blue-600 text-lg">{(item.price * item.quantity).toLocaleString("tr-TR")} ₺</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="bg-gray-50 p-6 border-t border-gray-100 flex justify-between items-center">
              <span className="text-gray-600 font-medium">Genel Toplam:</span>
              <span className="text-2xl font-black text-gray-900">{order.totalPrice?.toLocaleString("tr-TR")} ₺</span>
            </div>
          </div>
        </div>

        {/* SAĞ TARAF: Müşteri ve Teslimat Bilgileri (1 Birim) */}
        <div className="lg:col-span-1 space-y-6">
          {/* Müşteri Kartı */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">👤 Müşteri Bilgileri</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Ad Soyad</p>
                <p className="font-medium text-gray-900">{order.user?.name || "Anonim Ziyaretçi"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">E-Posta Adresi</p>
                <p className="font-medium text-gray-900 break-words">{order.user?.email || "-"}</p>
              </div>
            </div>
          </div>

          {/* Teslimat Adresi Kartı */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">📍 Teslimat Adresi</h2>
            </div>
            <div className="p-6">
              {/* Prisma şemanda address alanı varsa order.address kullanılabilir, yoksa geçici metin */}
              <p className="text-gray-700 leading-relaxed">
                {(order as any).address || "Müşteri adres bilgisi sistemde kayıtlı değil veya sipariş aşamasında girilmemiş."}
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}