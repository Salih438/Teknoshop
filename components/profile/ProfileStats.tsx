"use client";

import Link from "next/link";

interface ProfileStatsProps {
  totalOrders: number;
  totalSpent: number;
  deliveredOrders: number;
  favoritesCount: number; // Gelecekte gerçek veritabanı bağlantısı ile güncellenecek
}

export default function ProfileStats({ totalOrders, totalSpent, deliveredOrders, favoritesCount }: ProfileStatsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 animate-in fade-in duration-500">
      
      {/* 1. KART: Toplam Sipariş */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center gap-4 hover:shadow-md hover:-translate-y-1 transition-all group">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-7 sm:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </div>
        <div>
          <p className="text-[10px] sm:text-[11px] text-gray-400 font-extrabold uppercase tracking-widest mb-0.5">Toplam Sipariş</p>
          <p className="text-xl sm:text-2xl font-black text-gray-900">{totalOrders}</p>
        </div>
      </div>
      
      {/* 2. KART: Toplam Harcama */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center gap-4 hover:shadow-md hover:-translate-y-1 transition-all group">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-7 sm:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <p className="text-[10px] sm:text-[11px] text-gray-400 font-extrabold uppercase tracking-widest mb-0.5">Toplam Harcama</p>
          <p className="text-xl sm:text-2xl font-black text-emerald-600">{totalSpent.toLocaleString("tr-TR")} ₺</p>
        </div>
      </div>

      {/* 3. KART: Teslim Alınan */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center gap-4 hover:shadow-md hover:-translate-y-1 transition-all group">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-7 sm:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <p className="text-[10px] sm:text-[11px] text-gray-400 font-extrabold uppercase tracking-widest mb-0.5">Teslim Alınan</p>
          <p className="text-xl sm:text-2xl font-black text-teal-600">{deliveredOrders}</p>
        </div>
      </div>

      {/* 4. KART: Favoriler */}
      <Link href="/favorites" className="bg-white p-5 sm:p-6 rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center gap-4 hover:shadow-md hover:-translate-y-1 transition-all group cursor-pointer">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-7 sm:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </div>
        <div>
          <p className="text-[10px] sm:text-[11px] text-gray-400 font-extrabold uppercase tracking-widest mb-0.5">Favoriler</p>
          <p className="text-xl sm:text-2xl font-black text-red-500">{favoritesCount}</p>
        </div>
      </Link>

    </div>
  );
}