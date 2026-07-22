import { requireAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";

import Image from "next/image";
// app/admin/orders/[id]/page.tsx
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import OrderStatusSelect from "../OrderStatusSelect"; // Yolunu kendi klasör yapına göre ./ veya ../ olarak ayarlayabilirsin

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  try {
    await requireAdmin();
  } catch {
    redirect("/");
  }

  const resolvedParams = await params;
  const orderId = resolvedParams.id;

  // SİPARİŞİ TÜM DETAYLARIYLA ÇEKİYORUZ (Müşteri, Adres, Ürünler)
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: true,
      address: true,
      items: {
        include: {
          product: {
            include: {
              images: true // Ürün resimlerini de getiriyoruz
            }
          }
        }
      }
    }
  });

  if (!order) {
    return notFound();
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* ÜST BİLGİ VE GERİ DÖN BUTONU */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/admin/orders" className="bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 shadow-sm">
            <span>←</span> Siparişlere Dön
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            Sipariş Detayı <span className="text-gray-400 text-xl font-mono ml-2">#{order.id.slice(-8).toUpperCase()}</span>
          </h1>
        </div>
        
        {/* SİPARİŞ DURUMUNU BURADAN DA DEĞİŞTİREBİLSİN */}
        <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100">
          <OrderStatusSelect orderId={order.id} currentStatus={order.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* SOL KOLON: SİPARİŞ EDİLEN ÜRÜNLER (2 Kolon Genişliğinde) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                📦 Satın Alınan Ürünler
              </h2>
              <span className="bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-full text-xs">
                {order.items.length} Çeşit Ürün
              </span>
            </div>
            
            <div className="divide-y divide-gray-100">
              {order.items.map((item) => {
                // Ürünün ilk görselini alıyoruz, yoksa placeholder gösteriyoruz
                const imageUrl = item.product.images?.[0]?.imageUrl || "https://via.placeholder.com/150";

                return (
                  <div key={item.id} className="p-6 flex items-center gap-6 hover:bg-gray-50 transition">
                    <Image src={imageUrl} 
                      alt={item.product.name} 
                      className="w-20 h-20 object-cover rounded-xl border border-gray-200"
                    width={500} height={500} />
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-lg mb-1">{item.product.name}</h3>
                      <p className="text-sm text-gray-500 font-mono">SKU: {item.product.sku || "Belirtilmemiş"}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{item.price.toLocaleString("tr-TR")} ₺</p>
                      <p className="text-sm text-gray-500 font-medium">Adet: {item.quantity}</p>
                      <p className="font-extrabold text-blue-600 mt-1 mt-1">
                        {(item.price * item.quantity).toLocaleString("tr-TR")} ₺
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* SAĞ KOLON: MÜŞTERİ, ADRES VE ÖZET BİLGİLERİ */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* MÜŞTERİ KARTI */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
              👤 Müşteri Bilgileri
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Ad Soyad</p>
                <p className="font-medium text-gray-900">{order.user.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">E-Posta</p>
                <p className="font-medium text-gray-900">{order.user.email}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Telefon</p>
                <p className="font-medium text-gray-900">{order.user.phone || "Belirtilmemiş"}</p>
              </div>
            </div>
          </div>

          {/* TESLİMAT ADRESİ KARTI */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
              📍 Teslimat Adresi
            </h3>
            {order.address ? (
              <div className="space-y-2">
                <p className="font-bold text-gray-800">{order.address.title}</p>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {order.address.address}
                </p>
                <p className="text-sm font-medium text-gray-900 mt-2">
                  {order.address.district} / {order.address.city}
                </p>
                {order.address.postalCode && (
                  <p className="text-sm text-gray-500">Posta Kodu: {order.address.postalCode}</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-red-500 font-medium">Adres bilgisi bulunamadı.</p>
            )}
          </div>

          {/* SİPARİŞ ÖZETİ KARTI */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
              💰 Sipariş Özeti
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Ara Toplam</span>
                <span className="font-medium">{order.totalPrice.toLocaleString("tr-TR")} ₺</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Kargo Ücreti</span>
                <span className="font-medium text-green-600">Ücretsiz</span>
              </div>
              <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                <span className="font-bold text-gray-900 text-base">Genel Toplam</span>
                <span className="font-extrabold text-blue-600 text-xl">{order.totalPrice.toLocaleString("tr-TR")} ₺</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}