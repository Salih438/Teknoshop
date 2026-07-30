"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export interface CustomerDetailDrawerData {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  avatarUrl?: string | null;
  ordersCount: number;
  returnsCount: number;
  exchangesCount: number;
  totalSpent: number;
  segment: { label: string; bg: string; text: string; icon: string };
  addresses: { id: string; title: string; city: string; district: string; address: string }[];
  recentOrders: { id: string; totalPrice: number; status: string; createdAt: string }[];
}

interface CustomerDetailDrawerProps {
  customer: CustomerDetailDrawerData | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function CustomerDetailDrawer({ customer, isOpen, onClose }: CustomerDetailDrawerProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !customer) return null;

  const initial = customer.name ? customer.name.charAt(0).toUpperCase() : "U";

  return (
    <div className="fixed inset-0 z-50 overflow-hidden text-left">
      {/* MOBİL VE MASAÜSTÜ ARKA PLAN BACKDROP OVERLAY */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10 pointer-events-none">
        {/* 🚀 KAYAR CRM DRAWER PANELİ (DESKTOP SAĞ, MOBİL TAM GENİŞLİK) */}
        <div className="w-screen max-w-md md:max-w-lg bg-white shadow-2xl border-l border-gray-200 pointer-events-auto flex flex-col justify-between rounded-l-3xl animate-in slide-in-from-right duration-300">
          
          {/* DRAWER HEADER */}
          <div className="p-5 sm:p-6 border-b border-gray-100 bg-gray-50/80 flex items-center justify-between rounded-tl-3xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-black text-xl flex items-center justify-center shadow-md">
                {customer.avatarUrl ? (
                  <img src={customer.avatarUrl} alt={customer.name} className="w-full h-full object-cover rounded-2xl" />
                ) : (
                  initial
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-gray-900 text-base sm:text-lg">{customer.name}</h3>
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${customer.segment.bg} ${customer.segment.text}`}>
                    {customer.segment.icon} {customer.segment.label}
                  </span>
                </div>
                <p className="text-gray-500 text-xs mt-0.5 font-medium">{customer.email}</p>
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
            
            {/* FİNANSAL VE İSTATİSTİK METRİKLERİ */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50/60 border border-blue-100 p-3.5 rounded-2xl">
                <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wider block">Toplam Harcama</span>
                <p className="text-xl font-black text-blue-900 mt-0.5">{customer.totalSpent.toLocaleString("tr-TR")} ₺</p>
              </div>

              <div className="bg-emerald-50/60 border border-emerald-100 p-3.5 rounded-2xl">
                <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider block">Sipariş Sayısı</span>
                <p className="text-xl font-black text-emerald-900 mt-0.5">{customer.ordersCount} Adet</p>
              </div>

              <div className="bg-amber-50/60 border border-amber-100 p-3.5 rounded-2xl">
                <span className="text-[10px] font-extrabold text-amber-600 uppercase tracking-wider block">İade / Değişim</span>
                <p className="text-lg font-black text-amber-900 mt-0.5">{customer.returnsCount} İade • {customer.exchangesCount} Değişim</p>
              </div>

              <div className="bg-gray-50 border border-gray-200 p-3.5 rounded-2xl">
                <span className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider block">Kayıt Tarihi</span>
                <p className="text-sm font-bold text-gray-800 mt-1">{new Date(customer.createdAt).toLocaleDateString("tr-TR")}</p>
              </div>
            </div>

            {/* KULLANICI DETAY BİLGİLERİ */}
            <div className="space-y-2.5 bg-gray-50 p-4 rounded-2xl border border-gray-200 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-bold">Kullanıcı Durumu:</span>
                <span className={`font-extrabold px-2.5 py-0.5 rounded-full ${customer.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                  {customer.isActive ? "🟢 Aktif Hesap" : "🔴 Pasif / Engelli"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-bold">Telefon:</span>
                <span className="font-bold text-gray-900">{customer.phone || "Telefon Belirtilmedi"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-bold">Sistem Rolü:</span>
                <span className="font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">{customer.role}</span>
              </div>
            </div>

            {/* İLETİŞİM VE ADRESLER */}
            <div>
              <h4 className="font-extrabold text-gray-900 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span>🏠</span> Kayıtlı Adresler ({customer.addresses.length})
              </h4>
              {customer.addresses.length === 0 ? (
                <p className="text-xs text-gray-400 font-medium">Kayıtlı adres bulunmuyor.</p>
              ) : (
                <div className="space-y-2">
                  {customer.addresses.map((addr) => (
                    <div key={addr.id} className="p-3 bg-white border border-gray-200 rounded-xl text-xs space-y-0.5 shadow-2xs">
                      <span className="font-extrabold text-gray-900 block">{addr.title}</span>
                      <p className="text-gray-600">{addr.address}</p>
                      <p className="text-gray-400 font-bold">{addr.district} / {addr.city}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SON SİPARİŞ HAREKETLERİ */}
            <div>
              <h4 className="font-extrabold text-gray-900 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span>📋</span> Son Siparişler ({customer.recentOrders.length})
              </h4>
              {customer.recentOrders.length === 0 ? (
                <p className="text-xs text-gray-400 font-medium">Henüz sipariş kaydı yok.</p>
              ) : (
                <div className="space-y-2">
                  {customer.recentOrders.map((ord) => (
                    <div key={ord.id} className="p-3 bg-white border border-gray-200 rounded-xl text-xs flex items-center justify-between shadow-2xs">
                      <div>
                        <span className="font-mono font-bold text-gray-900">#{ord.id.slice(-8).toUpperCase()}</span>
                        <span className="text-[10px] text-gray-400 block">{new Date(ord.createdAt).toLocaleDateString("tr-TR")}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-blue-600 block">{ord.totalPrice.toLocaleString("tr-TR")} ₺</span>
                        <span className="text-[10px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-bold">{ord.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* DRAWER FOOTER AKSİYONLARI */}
          <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50/80 flex items-center justify-between gap-3 rounded-bl-3xl">
            <a
              href={`mailto:${customer.email}`}
              className="bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 font-extrabold px-4 py-2.5 rounded-xl text-xs transition flex-1 text-center min-h-[44px] flex items-center justify-center gap-1.5"
            >
              <span>📧</span> E-Posta Gönder
            </a>

            <Link
              href={`/admin/users/${customer.id}`}
              onClick={onClose}
              className="bg-gray-900 hover:bg-gray-800 text-white font-extrabold px-4 py-2.5 rounded-xl text-xs transition flex-1 text-center min-h-[44px] flex items-center justify-center gap-1.5 shadow-xs"
            >
              <span>Detaylı CRM Profili</span>
              <span>➔</span>
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
