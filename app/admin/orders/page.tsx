// app/admin/orders/page.tsx
import { prisma } from "@/lib/prisma";
import OrderStatusSelect from "./OrderStatusSelect";
import { Toaster } from "react-hot-toast";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  // 1. İSTATİSTİKLER İÇİN VERİ ÇEKİMİ
  const totalOrders = await prisma.order.count();
  const pendingOrders = await prisma.order.count({ where: { status: "PENDING" } });
  const shippedOrders = await prisma.order.count({ where: { status: "SHIPPED" } });
  const deliveredOrders = await prisma.order.count({ where: { status: "DELIVERED" } });

  // 2. SİPARİŞ LİSTESİ VERİ ÇEKİMİ (Hata burada düzeltildi: orderItems yerine items yazıldı)
  const orders = await prisma.order.findMany({
    include: {
      user: true,
      items: true, 
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <Toaster position="bottom-right" />
      
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Sipariş Yönetimi</h1>
          <p className="text-gray-500 mt-2">Tüm siparişleri, durumlarını ve detaylarını buradan takip edin.</p>
        </div>
      </div>

      {/* ÖZET İSTATİSTİK KARTLARI */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-blue-500">
          <p className="text-sm font-medium text-gray-500">Toplam Sipariş</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{totalOrders}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-orange-500">
          <p className="text-sm font-medium text-gray-500">Bekleyen (Pending)</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{pendingOrders}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-indigo-500">
          <p className="text-sm font-medium text-gray-500">Kargoda (Shipped)</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{shippedOrders}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-green-500">
          <p className="text-sm font-medium text-gray-500">Teslim Edilen</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{deliveredOrders}</p>
        </div>
      </div>

      {/* ARAMA VE FİLTRELEME ÇUBUĞU (UI Temeli) */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
          <input 
            type="text" 
            placeholder="Sipariş No veya Müşteri Adı Ara..." 
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <select className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
          <option value="">Tüm Durumlar</option>
          <option value="PENDING">Bekleyen</option>
          <option value="SHIPPED">Kargoda</option>
          <option value="DELIVERED">Teslim Edilen</option>
        </select>
      </div>

      {/* TABLO */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-500 uppercase tracking-wider">
                <th className="p-4 font-medium">Sipariş No</th>
                <th className="p-4 font-medium">Müşteri</th>
                <th className="p-4 font-medium">Tarih</th>
                <th className="p-4 font-medium">Toplam</th>
                <th className="p-4 font-medium">Durum</th>
                <th className="p-4 font-medium text-center">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition">
                  <td className="p-4 text-sm font-mono text-gray-600">#{order.id.substring(0, 8).toUpperCase()}</td>
                  <td className="p-4">
                    <p className="font-bold text-gray-900">{order.user?.name || "Anonim"}</p>
                    <p className="text-xs text-gray-500">{order.user?.email}</p>
                  </td>
                  <td className="p-4 text-sm text-gray-600">{new Date(order.createdAt).toLocaleDateString("tr-TR")}</td>
                  <td className="p-4 font-bold text-gray-900">{order.totalPrice?.toLocaleString("tr-TR") || 0} ₺</td>
                  <td className="p-4">
                    <OrderStatusSelect orderId={order.id} currentStatus={order.status} />
                  </td>
                  <td className="p-4 text-center">
                    <Link href={`/admin/orders/${order.id}`} className="text-blue-600 hover:text-blue-800 text-sm font-medium bg-blue-50 px-3 py-1.5 rounded-lg transition">
                      Detayları Gör
                    </Link>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">Kayıtlı sipariş bulunamadı.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}