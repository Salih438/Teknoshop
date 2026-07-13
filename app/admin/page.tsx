// app/admin/page.tsx
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  // 1. MEVCUT VERİLERİN (Katalog ve Envanter)
  const totalProducts = await prisma.product.count();
  const totalCategories = await prisma.category.count();
  const totalBrands = await prisma.brand.count();
  const totalUsers = await prisma.user.count();

  // 2. YENİ E-TİCARET VERİLERİ (Finans ve Siparişler)
  const totalOrders = await prisma.order.count();
  
  // Toplam Ciroyu (totalPrice) Toplama İşlemi
  const revenueAggregation = await prisma.order.aggregate({
    _sum: { totalPrice: true },
  });
  const totalRevenue = revenueAggregation._sum.totalPrice || 0;

  // Hızlı Bakış için Son 5 Siparişi Çekme
  const recentOrders = await prisma.order.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: { user: true },
  });

  return (
    <div className="space-y-8">
      
      {/* ÜST BAŞLIK */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Komuta Merkezi</h1>
        <p className="text-gray-500 mt-2">Mağazanızın katalog özeti ve güncel satış istatistikleri.</p>
      </div>

      {/* 1. SATIR: SATIŞ VE FİNANS İSTATİSTİKLERİ (Öne Çıkan Renkli Kartlar) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-emerald-500 to-green-600 p-6 rounded-2xl shadow-lg text-white">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-green-100 text-sm font-medium mb-1">Toplam Ciro</p>
              <h2 className="text-4xl font-bold">{totalRevenue.toLocaleString("tr-TR")} ₺</h2>
            </div>
            <div className="p-3 bg-white/20 rounded-xl text-2xl">💰</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-6 rounded-2xl shadow-lg text-white">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-blue-100 text-sm font-medium mb-1">Toplam Sipariş</p>
              <h2 className="text-4xl font-bold">{totalOrders} <span className="text-xl font-normal opacity-80">Adet</span></h2>
            </div>
            <div className="p-3 bg-white/20 rounded-xl text-2xl">📦</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-6 rounded-2xl shadow-lg text-white">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-purple-100 text-sm font-medium mb-1">Kayıtlı Kullanıcı</p>
              <h2 className="text-4xl font-bold">{totalUsers} <span className="text-xl font-normal opacity-80">Kişi</span></h2>
            </div>
            <div className="p-3 bg-white/20 rounded-xl text-2xl">👥</div>
          </div>
        </div>
      </div>

      {/* 2. SATIR: KATALOG VE ENVANTER İSTATİSTİKLERİ (Senin Tasarımın) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 border-l-4 border-l-blue-500 flex justify-between items-center">
          <div>
            <p className="text-sm font-medium text-gray-500">Toplam Ürün</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{totalProducts}</p>
          </div>
          <span className="text-2xl opacity-50">🛍️</span>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 border-l-4 border-l-green-500 flex justify-between items-center">
          <div>
            <p className="text-sm font-medium text-gray-500">Kategoriler</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{totalCategories}</p>
          </div>
          <span className="text-2xl opacity-50">📂</span>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 border-l-4 border-l-orange-500 flex justify-between items-center">
          <div>
            <p className="text-sm font-medium text-gray-500">Markalar</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{totalBrands}</p>
          </div>
          <span className="text-2xl opacity-50">🏷️</span>
        </div>
      </div>

      {/* ALT KISIM: SON SİPARİŞLER (Hareketlilik Katmak İçin) */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="font-bold text-gray-800">Son Gelen Siparişler</h3>
          <Link href="/admin/orders" className="text-sm text-blue-600 hover:text-blue-800 font-medium transition">
            Tümünü Gör &rarr;
          </Link>
        </div>
        
        <div className="divide-y divide-gray-100">
          {recentOrders.map((order) => (
            <div key={order.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  {order.user?.name ? order.user.name.charAt(0).toUpperCase() : "U"}
                </div>
                <div>
                  <p className="font-bold text-gray-900">{order.user?.name || "Anonim Müşteri"}</p>
                  <p className="text-sm text-gray-500">#{order.id.substring(0, 8).toUpperCase()} • {new Date(order.createdAt).toLocaleDateString("tr-TR")}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900 text-lg">{order.totalPrice?.toLocaleString("tr-TR")} ₺</p>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mt-1 ${
                  order.status === "DELIVERED" ? "bg-green-100 text-green-700" :
                  order.status === "SHIPPED" ? "bg-blue-100 text-blue-700" :
                  "bg-orange-100 text-orange-700"
                }`}>
                  {order.status}
                </span>
              </div>
            </div>
          ))}

          {recentOrders.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              Henüz sipariş alınmamış.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}