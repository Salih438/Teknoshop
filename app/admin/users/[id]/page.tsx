// app/admin/users/[id]/page.tsx
import { requireAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function UserDetailPage({
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
  const userId = resolvedParams.id;

  // 1. KULLANICIYI TÜM İLİŞKİLERİYLE VERİTABANINDAN ÇEK
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      // Şemandaki ilişkilerle birebir eşleştiği için artık hepsini açtık
      addresses: true,
      favorites: { include: { product: true } },
      reviews: { include: { product: true } },
      orders: {
        orderBy: { createdAt: "desc" },
      },
      // HATANIN ÇÖZÜLDÜĞÜ YER: Artık favorileri ve yorumları da Prisma'ya saydırıyoruz
      _count: {
        select: { 
            orders: true, 
            favorites: true, 
            reviews: true 
        },
      },
    },
  });

  if (!user) {
    return notFound();
  }

  // Toplam harcamayı hesapla (Şemandaki alan adı totalPrice olduğu için ona göre uyarlandı)
  const totalSpent = user.orders?.reduce((sum, order) => sum + (order.totalPrice || 0), 0) || 0;
  
  // İsim baş harfi (Avatar için)
  const initial = user.name ? user.name.charAt(0).toUpperCase() : "U";

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* ÜST BİLGİ VE GERİ DÖN BUTONU */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/admin/users" className="bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 shadow-sm">
            <span>←</span> Geri Dön
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">Kullanıcı Detayı</h1>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition shadow-sm">
          Profili Düzenle
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* SOL KOLON: PROFİL KARTI */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col items-center text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700 text-4xl font-extrabold rounded-full flex items-center justify-center mb-4 shadow-inner">
              {initial}
            </div>
            <h2 className="text-2xl font-bold text-gray-900">{user.name || "İsimsiz Kullanıcı"}</h2>
            <p className="text-gray-500 font-medium mb-4">{user.email}</p>
            
            <span className={`px-4 py-1.5 rounded-full text-sm font-bold tracking-wide ${user.role === 'ADMIN' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
              {user.role}
            </span>

            <div className="w-full mt-8 space-y-4 text-left border-t border-gray-100 pt-6">
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Telefon</p>
                <p className="text-gray-800 font-medium">{user.phone || "Belirtilmemiş"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Kayıt Tarihi</p>
                <p className="text-gray-800 font-medium">{new Date(user.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
            </div>
          </div>

          {/* ADRESLER KARTI */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span>📍</span> Kayıtlı Adresler
            </h3>
            
            {user.addresses && user.addresses.length > 0 ? (
              <div className="space-y-3">
                {user.addresses.map((address) => (
                  <div key={address.id} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <p className="text-sm font-bold text-gray-800 mb-1">{address.title}</p>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {address.address}, {address.district} / {address.city}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-sm text-gray-500 font-medium">Kayıtlı adres bulunmuyor.</p>
              </div>
            )}
          </div>
        </div>

        {/* SAĞ KOLON: İSTATİSTİKLER VE SİPARİŞLER */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* İSTATİSTİK KARTLARI */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Toplam Sipariş</p>
              <p className="text-2xl font-extrabold text-gray-900">{user._count?.orders || 0}</p>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Toplam Harcama</p>
              <p className="text-2xl font-extrabold text-blue-600">{totalSpent.toLocaleString('tr-TR')} ₺</p>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Favoriler</p>
              <p className="text-2xl font-extrabold text-red-500">{user._count?.favorites || 0}</p>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Yorumlar</p>
              <p className="text-2xl font-extrabold text-yellow-500">{user._count?.reviews || 0}</p>
            </div>
          </div>

          {/* SON SİPARİŞLER TABLOSU */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-800">📦 Son Siparişleri</h3>
            </div>
            
            {user.orders && user.orders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-white">
                    <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wider">
                      <th className="p-4 font-bold">Sipariş No</th>
                      <th className="p-4 font-bold">Tarih</th>
                      <th className="p-4 font-bold">Tutar</th>
                      <th className="p-4 font-bold">Durum</th>
                      <th className="p-4 font-bold text-right">Detay</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {user.orders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50 transition">
                        <td className="p-4 font-medium text-gray-900 text-sm">#{order.id.slice(-6).toUpperCase()}</td>
                        <td className="p-4 text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString('tr-TR')}
                        </td>
                        <td className="p-4 font-bold text-gray-900 text-sm">
                          {order.totalPrice?.toLocaleString('tr-TR')} ₺
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-md text-xs font-bold
                            ${order.status === 'PENDING' ? 'bg-orange-100 text-orange-700' : ''}
                            ${order.status === 'DELIVERED' ? 'bg-green-100 text-green-700' : ''}
                            ${order.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : ''}
                            ${!['PENDING', 'DELIVERED', 'CANCELLED'].includes(order.status) ? 'bg-blue-100 text-blue-700' : ''}
                          `}>
                            {order.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button className="text-blue-600 hover:text-blue-800 font-medium text-sm transition">İncele →</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center">
                <div className="text-4xl mb-3">🛒</div>
                <p className="text-gray-500 font-medium">Bu kullanıcının henüz siparişi bulunmuyor.</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}