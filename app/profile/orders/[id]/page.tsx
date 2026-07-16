import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import OrderProgressBar from "@/components/profile/OrderProgressBar";

export const dynamic = "force-dynamic";

export default async function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  // --- 1. KİMLİK KONTROLÜ ---
  const clerkUser = await currentUser();
  if (!clerkUser) redirect("/");

  const resolvedParams = await params;
  const orderId = resolvedParams.id;

  const dbUser = await prisma.user.findUnique({
    where: { email: clerkUser.emailAddresses[0].emailAddress },
  });
  if (!dbUser) redirect("/");

  // --- 2. GÜVENLİK DUVARI VE GERÇEK VERİLERİ ÇEKME ---
  // Sadece bu ID'ye sahip VE siparişi veren kişi giriş yapan kişiyle aynıysa veriyi getir!
  // include ile siparişin içindeki Adres ve Kargo (Shipment) bilgilerini de çekiyoruz.
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      userId: dbUser.id, 
    },
    include: {
      items: {
        include: { product: true }
      },
      address: true,   // YENİ: Gerçek teslimat adresi bağlantısı
      shipment: true   // YENİ: Gerçek kargo ve takip no bağlantısı
    }
  });

  // Sipariş yoksa veya başkasına aitse doğrudan 404 sayfasına fırlat
  if (!order) return notFound();

  // --- 3. DİNAMİK VERİ BAĞLANTILARI ---
  // Artık sahte veriler yerine doğrudan veritabanından çekilen bilgileri kullanıyoruz.
  const kargoTakipNo = order.shipment?.trackingNumber || "Bekleniyor...";
  const kargoFirmasi = order.shipment?.company || "Belirtilmedi";
  
  const teslimatBasligi = order.address?.title || "Teslimat Adresi";
  const teslimatAdresi = order.address 
    ? `${order.address.address}, ${order.address.district} / ${order.address.city}`
    : "Adres bilgisi bulunamadı.";

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 min-h-screen">
      
      {/* Üst Kısım (Breadcrumb & Başlık) */}
      <div className="mb-8">
        <div className="text-sm text-gray-500 mb-4 flex items-center gap-2">
          <Link href="/profile" className="hover:text-blue-600 transition">Hesabım</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">Sipariş Detayı</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="text-3xl font-extrabold text-gray-900">Sipariş Detayı</h1>
          <div className="bg-gray-100 text-gray-700 px-4 py-2 rounded-xl font-mono text-sm font-bold border border-gray-200">
            Sipariş No: #{order.id.slice(-8).toUpperCase()}
          </div>
        </div>
      </div>

      {/* İlerleme Çubuğu */}
      <div className="bg-white p-6 md:p-10 rounded-2xl shadow-sm border border-gray-100 mb-8">
        <h3 className="font-bold text-gray-900 mb-6">Sipariş Durumu</h3>
        <OrderProgressBar status={order.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* SOL KOLON: ÜRÜN LİSTESİ */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-900">Satın Alınan Ürünler</h3>
              <span className="text-sm font-bold text-gray-500">{order.items.length} Ürün</span>
            </div>
            <div className="p-6 space-y-6">
              {order.items.map((item) => (
                <div key={item.id} className="flex gap-4 items-center">
                  <div className="w-20 h-20 bg-gray-50 rounded-xl border border-gray-100 flex-shrink-0 flex items-center justify-center p-2">
                    <span className="text-2xl">📦</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 line-clamp-1">{item.product?.name || "Silinmiş Ürün"}</h4>
                    <p className="text-sm text-gray-500 mt-1">Adet: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-extrabold text-blue-600 text-lg">{(item.price * item.quantity).toLocaleString("tr-TR")} ₺</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SAĞ KOLON: TESLİMAT VE ÖDEME ÖZETİ */}
        <div className="space-y-6">
          
          {/* Teslimat Kartı */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              📍 Teslimat Bilgileri
            </h3>
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-gray-500 font-medium mb-1">Adres Başlığı</p>
                <p className="font-bold text-gray-900">{teslimatBasligi}</p>
              </div>
              <div>
                <p className="text-gray-500 font-medium mb-1">Açık Adres</p>
                <p className="font-bold text-gray-900 leading-relaxed">{teslimatAdresi}</p>
              </div>
              <div>
                <p className="text-gray-500 font-medium mb-1">Kargo Firması & Takip No</p>
                <div className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500">{kargoFirmasi}</span>
                    <span className="font-mono font-bold text-blue-600">{kargoTakipNo}</span>
                  </div>
                  {kargoTakipNo !== "Bekleniyor..." && (
                    <button className="text-gray-400 hover:text-gray-700 transition" title="Kopyala">📋</button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Ödeme Özeti Kartı */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              💳 Ödeme Özeti
            </h3>
            <div className="space-y-3 text-sm border-b border-gray-100 pb-4 mb-4">
              <div className="flex justify-between text-gray-600">
                <span>Sipariş Tutarı</span>
                <span className="font-medium">{order.totalPrice.toLocaleString("tr-TR")} ₺</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Kargo Ücreti</span>
                <span className="font-medium text-green-600">Fiyata Dahil</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-bold text-gray-900">Genel Toplam</span>
              <span className="text-2xl font-black text-blue-600">{order.totalPrice.toLocaleString("tr-TR")} ₺</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}