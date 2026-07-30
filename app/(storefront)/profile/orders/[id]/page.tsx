import Image from "next/image";
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
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      userId: dbUser.id, 
    },
    include: {
      items: {
        include: { 
          product: {
            include: { images: true } // 🚀 YENİ: Ürün resimlerini çekmek için eklendi
          } 
        }
      },
      address: true, 
      shipment: true 
    }
  });

  // Sipariş yoksa veya başkasına aitse 404 sayfasına fırlat
  if (!order) return notFound();

  // --- 3. DİNAMİK VERİ BAĞLANTILARI ---
  const kargoTakipNo = order.shipment?.trackingNumber || "Henüz atanmadı";
  const kargoFirmasi = order.shipment?.company || "Kargo firması bekleniyor";
  
  const teslimatBasligi = order.address?.title || "Teslimat Adresi";
  const teslimatAdresi = order.address 
    ? `${order.address.address}, ${order.address.district} / ${order.address.city}`
    : "Adres bilgisi bulunamadı.";

  // Tarih Formatlama (Örn: 15 Ekim 2026, 14:30)
  const formattedDate = new Date(order.createdAt).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 min-h-screen animate-in fade-in duration-500">
      
      {/* --- ÜST KISIM (BREADCRUMB & BAŞLIK) --- */}
      <div className="mb-8 border-b border-gray-100 pb-6">
        <div className="text-sm text-gray-500 mb-4 flex items-center gap-2">
          <Link href="/profile" className="hover:text-blue-600 transition font-medium">Hesabım</Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-900 font-bold">Sipariş Detayı</span>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Sipariş Detayı</h1>
            <p className="text-gray-500 mt-2 font-medium flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              {formattedDate}
            </p>
          </div>
          <div className="bg-gray-50 text-gray-800 px-5 py-2.5 rounded-xl border border-gray-200 flex flex-col items-end">
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-0.5">Sipariş Numarası</span>
            <span className="font-mono font-extrabold text-lg">#{order.id.slice(-8).toUpperCase()}</span>
          </div>
        </div>
      </div>

      {/* --- İLERLEME ÇUBUĞU --- */}
      <div className="bg-white p-6 md:p-10 rounded-3xl shadow-sm border border-gray-100 mb-8">
        <h3 className="text-lg font-extrabold text-gray-900 mb-8 flex items-center gap-2">
          <span className="bg-blue-50 text-blue-600 p-2 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </span>
          Sipariş Durumu
        </h3>
        <OrderProgressBar status={order.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* SOL KOLON: ÜRÜN LİSTESİ */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <h3 className="font-extrabold text-gray-900 flex items-center gap-2">
                <span className="text-xl">🛍️</span> Satın Alınan Ürünler
              </h3>
              <span className="bg-white border border-gray-200 px-3 py-1 rounded-lg text-sm font-bold text-gray-600 shadow-sm">
                {order.items.length} Ürün
              </span>
            </div>
            
            <div className="p-6 space-y-6">
              {order.items.map((item) => {
                const displayImage = item.product?.images?.[0]?.imageUrl;
                
                return (
                  <div key={item.id} className="flex gap-4 items-center">
                    <div className="w-24 h-24 bg-gray-50 rounded-2xl border border-gray-100 flex-shrink-0 flex items-center justify-center p-2 overflow-hidden">
                      {displayImage ? (
                        <Image src={displayImage} alt={item.product?.name} className="max-w-full max-h-full object-contain" width={500} height={500} />
                      ) : (
                        <span className="text-3xl">📦</span>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <Link href={item.product ? `/products/${item.product.id}` : "#"}>
                        <h4 className="font-bold text-gray-900 line-clamp-2 hover:text-blue-600 transition-colors">
                          {item.product?.name || "Silinmiş Ürün"}
                        </h4>
                      </Link>
                      <p className="text-sm font-bold text-gray-500 mt-2 bg-gray-100 inline-block px-2 py-1 rounded-md">
                        Adet: {item.quantity}
                      </p>
                    </div>
                    
                    <div className="text-right flex-shrink-0">
                      <p className="font-extrabold text-blue-600 text-xl">{(item.price * item.quantity).toLocaleString("tr-TR")} ₺</p>
                      <p className="text-xs font-bold text-gray-400 mt-1">Birim: {item.price.toLocaleString("tr-TR")} ₺</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* SAĞ KOLON: TESLİMAT VE ÖDEME ÖZETİ */}
        <div className="space-y-6 lg:col-span-1">
          
          {/* Teslimat Kartı */}
          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="font-extrabold text-gray-900 mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
              <span className="text-xl">📍</span> Teslimat Bilgileri
            </h3>
            
            <div className="space-y-5 text-sm">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Adres Başlığı</p>
                <p className="font-bold text-gray-900">{teslimatBasligi}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Açık Adres</p>
                <p className="font-medium text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100">{teslimatAdresi}</p>
              </div>
              
              <div className="pt-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Kargo Takip Bilgisi</p>
                <div className="flex flex-col gap-1 bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                  <span className="text-xs font-bold text-blue-800">{kargoFirmasi}</span>
                  <span className="font-mono font-extrabold text-blue-600 text-base">{kargoTakipNo}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Ödeme Özeti Kartı */}
          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="font-extrabold text-gray-900 mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
              <span className="text-xl">💳</span> Ödeme Özeti
            </h3>
            
            <div className="space-y-4 text-sm border-b border-gray-100 pb-6 mb-6">
              <div className="flex justify-between items-center text-gray-600">
                <span className="font-medium">Sipariş Tutarı</span>
                <span className="font-bold text-gray-900">{order.totalPrice.toLocaleString("tr-TR")} ₺</span>
              </div>
              <div className="flex justify-between items-center text-gray-600">
                <span className="font-medium">Kargo Ücreti</span>
                <span className="font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded text-xs">Fiyata Dahil</span>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="font-extrabold text-gray-900">Genel Toplam</span>
              <span className="text-3xl font-black text-blue-600">{order.totalPrice.toLocaleString("tr-TR")} ₺</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}