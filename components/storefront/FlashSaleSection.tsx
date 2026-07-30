"use client";

import { useState, useEffect } from "react";
import ProductCard, { ProductCardProps } from "@/components/ProductCard";

export default function FlashSaleSection({ products }: { products: ProductCardProps[] }) {
  const [timeLeft, setTimeLeft] = useState({ hours: 14, minutes: 32, seconds: 45 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 12, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!products || products.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 bg-gradient-to-br from-red-600 via-rose-600 to-pink-700 text-white rounded-3xl mb-10 sm:mb-16 shadow-xl relative overflow-hidden">
      
      {/* DEKORATİF ARKA PLAN HALKALARI */}
      <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -left-20 -top-20 w-80 h-80 bg-black/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 space-y-6">
        
        {/* FLASH SALE HEADER & COUNTDOWN TIMER */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/20 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-white/20 text-white font-black text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border border-white/30">
                ⚡ SINIRLI SÜRE FIRSATI
              </span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight mt-2 flex items-center gap-2">
              Flash Sale Fırsatları ⏰
            </h2>
            <p className="text-rose-100 text-xs sm:text-sm font-medium mt-1">
              Gece yarısına kadar seçili teknoloji ürünlerinde %40 ekstra indirim.
            </p>
          </div>

          {/* SAYAÇ SÜRESİ */}
          <div className="flex items-center gap-2 bg-black/30 p-2.5 rounded-2xl border border-white/20 backdrop-blur-md">
            <div className="text-center px-2">
              <span className="font-mono font-black text-xl sm:text-2xl text-white block">
                {String(timeLeft.hours).padStart(2, "0")}
              </span>
              <span className="text-[9px] font-bold text-rose-200 uppercase">Saat</span>
            </div>
            <span className="font-black text-xl text-rose-200">:</span>
            <div className="text-center px-2">
              <span className="font-mono font-black text-xl sm:text-2xl text-white block">
                {String(timeLeft.minutes).padStart(2, "0")}
              </span>
              <span className="text-[9px] font-bold text-rose-200 uppercase">Dakika</span>
            </div>
            <span className="font-black text-xl text-rose-200">:</span>
            <div className="text-center px-2">
              <span className="font-mono font-black text-xl sm:text-2xl text-rose-300 block animate-pulse">
                {String(timeLeft.seconds).padStart(2, "0")}
              </span>
              <span className="text-[9px] font-bold text-rose-200 uppercase">Saniye</span>
            </div>
          </div>
        </div>

        {/* 🚀 ÜRÜN KARTLARI DİZİLİMİ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 pt-2">
          {products.map((product) => (
            <div key={product.id} className="text-gray-900">
              <ProductCard product={{ ...product, badgeText: "⚡ FIRSAT" }} />
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
