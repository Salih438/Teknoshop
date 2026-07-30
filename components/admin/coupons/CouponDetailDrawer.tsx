"use client";

import { useEffect } from "react";
import Link from "next/link";

export interface CouponDetailDrawerData {
  id: string;
  code: string;
  discount: number;
  minAmount?: number | null;
  isSingleUse: boolean;
  usageLimit: number;
  usedCount: number;
  expireDate: string;
  isActive: boolean;
  createdAt: string;
  usages: {
    id: string;
    createdAt: string;
    user: { name: string; email: string };
    order: { id: string; totalPrice: number; status: string };
  }[];
}

interface CouponDetailDrawerProps {
  coupon: CouponDetailDrawerData | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function CouponDetailDrawer({ coupon, isOpen, onClose }: CouponDetailDrawerProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !coupon) return null;

  const isExpired = new Date(coupon.expireDate) < new Date();
  const usagePercentage = Math.min(100, Math.round((coupon.usedCount / coupon.usageLimit) * 100));
  const estimatedRevenue = coupon.usages.reduce((sum, u) => sum + (u.order?.totalPrice || 0), 0);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden text-left">
      {/* MOBİL VE MASAÜSTÜ ARKA PLAN BACKDROP OVERLAY */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10 pointer-events-none">
        {/* 🚀 KAYAR KUPON DRAWER PANELİ (DESKTOP SAĞ, MOBİL TAM GENİŞLİK / BOTTOM SHEET) */}
        <div className="w-screen max-w-md md:max-w-lg bg-white shadow-2xl border-l border-gray-200 pointer-events-auto flex flex-col justify-between rounded-l-3xl animate-in slide-in-from-right duration-300">
          
          {/* DRAWER HEADER */}
          <div className="p-5 sm:p-6 border-b border-gray-100 bg-gray-50/80 flex items-center justify-between rounded-tl-3xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white font-black text-xl flex items-center justify-center shadow-md">
                🎟️
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-mono font-black text-gray-900 text-lg uppercase tracking-wider">{coupon.code}</h3>
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                    coupon.isActive && !isExpired ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}>
                    {coupon.isActive && !isExpired ? "🟢 Aktif" : isExpired ? "🔴 Süresi Doldu" : "🔴 Pasif"}
                  </span>
                </div>
                <p className="text-gray-500 text-xs mt-0.5 font-medium">Kampanya Detay & Kullanım Analizi</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-200/70 hover:bg-gray-300 text-gray-600 flex items-center justify-center font-bold text-xs transition"
            >
              ✕
            </button>
          </div>

          {/* DRAWER İÇERİK LİSTESİ */}
          <div className="p-5 sm:p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
            
            {/* KULLANIM VE PERFORMANS KARTLARI */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-emerald-50/60 border border-emerald-100 p-3.5 rounded-2xl">
                <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider block">Kuponla Sağlanan Ciro</span>
                <p className="text-xl font-black text-emerald-900 mt-0.5">{estimatedRevenue.toLocaleString("tr-TR")} ₺</p>
              </div>

              <div className="bg-blue-50/60 border border-blue-100 p-3.5 rounded-2xl">
                <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wider block">Kullanım Adedi</span>
                <p className="text-xl font-black text-blue-900 mt-0.5">{coupon.usedCount} / {coupon.usageLimit}</p>
              </div>
            </div>

            {/* KULLANIM PROGRES BARI */}
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-2">
              <div className="flex justify-between text-xs font-bold text-gray-700">
                <span>Kupon Doluluk Oranı</span>
                <span>%{usagePercentage} Doldu</span>
              </div>
              <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
                <div
                  style={{ width: `${usagePercentage}%` }}
                  className="bg-blue-600 h-full rounded-full transition-all duration-500"
                />
              </div>
            </div>

            {/* KUPON KURALLARI ÖZETİ */}
            <div className="space-y-2.5 bg-gray-50 p-4 rounded-2xl border border-gray-200 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-bold">İndirim Miktarı:</span>
                <span className="font-extrabold text-emerald-600 text-sm">%{coupon.discount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-bold">Minimum Sepet Tutarı:</span>
                <span className="font-bold text-gray-900">
                  {coupon.minAmount ? `${coupon.minAmount.toLocaleString("tr-TR")} ₺` : "Limit Yok"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-bold">Kullanıcı Kısıtı:</span>
                <span className="font-bold text-blue-700">
                  {coupon.isSingleUse ? "Kişiye Özel (1 Kullanım)" : "Sınırsız Kullanım"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-bold">Son Kullanma Tarihi:</span>
                <span className="font-bold text-gray-900">{new Date(coupon.expireDate).toLocaleString("tr-TR")}</span>
              </div>
            </div>

            {/* KUPONU KULLANAN MÜŞTERİLER VEYA SİPARİŞLER */}
            <div>
              <h4 className="font-extrabold text-gray-900 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span>👥</span> Son Kullanımlar ({coupon.usages.length})
              </h4>
              {coupon.usages.length === 0 ? (
                <p className="text-xs text-gray-400 font-medium">Bu kupon henüz kullanılmamıştır.</p>
              ) : (
                <div className="space-y-2">
                  {coupon.usages.map((u) => (
                    <div key={u.id} className="p-3 bg-white border border-gray-200 rounded-xl text-xs space-y-1 shadow-2xs">
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-gray-900">{u.user?.name || "Anonim"}</span>
                        <span className="font-mono text-gray-500 text-[10px]">{new Date(u.createdAt).toLocaleDateString("tr-TR")}</span>
                      </div>
                      <div className="flex justify-between items-center text-gray-600">
                        <span>Sipariş: #{u.order?.id.slice(-8).toUpperCase()}</span>
                        <span className="font-bold text-blue-600">{u.order?.totalPrice.toLocaleString("tr-TR")} ₺</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* DRAWER FOOTER */}
          <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50/80 flex items-center justify-between gap-3 rounded-bl-3xl">
            <button
              onClick={onClose}
              className="bg-gray-900 hover:bg-gray-800 text-white font-extrabold px-4 py-2.5 rounded-xl text-xs transition flex-1 text-center min-h-[44px]"
            >
              Kapat
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
