"use client";

interface ProfileStatsProps {
  totalOrders: number;
  totalSpent: number;
  deliveredOrders: number;
  favoritesCount: number; // Şimdilik mock veri gelecek
}

export default function ProfileStats({ totalOrders, totalSpent, deliveredOrders, favoritesCount }: ProfileStatsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center items-center text-center hover:-translate-y-1 transition-transform">
        <span className="text-3xl mb-2">📦</span>
        <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Toplam Sipariş</p>
        <p className="text-2xl font-black text-gray-900">{totalOrders}</p>
      </div>
      
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center items-center text-center hover:-translate-y-1 transition-transform">
        <span className="text-3xl mb-2">💸</span>
        <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Toplam Harcama</p>
        <p className="text-2xl font-black text-blue-600">{totalSpent.toLocaleString("tr-TR")} ₺</p>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center items-center text-center hover:-translate-y-1 transition-transform">
        <span className="text-3xl mb-2">✅</span>
        <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Teslim Alınan</p>
        <p className="text-2xl font-black text-green-600">{deliveredOrders}</p>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center items-center text-center hover:-translate-y-1 transition-transform">
        <span className="text-3xl mb-2">🤍</span>
        <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Favoriler</p>
        <p className="text-2xl font-black text-red-500">{favoritesCount}</p>
      </div>
    </div>
  );
}