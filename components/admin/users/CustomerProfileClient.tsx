"use client";

import { useState } from "react";
import Link from "next/link";

export interface TimelineEvent {
  id: string;
  type: "REGISTER" | "ORDER" | "RETURN" | "EXCHANGE" | "ADDRESS";
  title: string;
  description: string;
  date: string;
  link?: string;
  icon: string;
  badgeBg: string;
}

export interface CustomerProfileDTO {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  isActive: boolean;
  avatarUrl?: string | null;
  createdAt: string;
  totalSpent: number;
  segment: { label: string; bg: string; text: string; icon: string };
  addresses: { id: string; title: string; city: string; district: string; address: string }[];
  orders: { id: string; totalPrice: number; status: string; createdAt: string; itemsCount: number }[];
  returns: { id: string; status: string; createdAt: string; orderId: string }[];
  exchanges: { id: string; status: string; createdAt: string; orderId: string }[];
  timeline: TimelineEvent[];
}

export default function CustomerProfileClient({ customer }: { customer: CustomerProfileDTO }) {
  const [activeTab, setActiveTab] = useState<"overview" | "orders" | "addresses" | "returns" | "timeline">("overview");

  const initial = customer.name ? customer.name.charAt(0).toUpperCase() : "U";

  return (
    <div className="space-y-6 w-full animate-in fade-in duration-300">
      
      {/* 🚀 ÜST GEZİNTİ VE GERİ DÖN BARI */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/users"
            className="w-10 h-10 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-center text-gray-700 font-bold text-sm transition shadow-xs"
          >
            ←
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">{customer.name}</h1>
              <span className={`text-xs font-black px-2.5 py-0.5 rounded-full ${customer.segment.bg} ${customer.segment.text}`}>
                {customer.segment.icon} {customer.segment.label}
              </span>
            </div>
            <p className="text-gray-500 text-xs sm:text-sm mt-0.5 font-medium">{customer.email} • ID: {customer.id}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={`mailto:${customer.email}`}
            className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-extrabold px-4 py-2.5 rounded-xl text-xs sm:text-sm transition min-h-[44px] flex items-center gap-1.5 shadow-xs"
          >
            <span>📧</span> E-Posta Gönder
          </a>
        </div>
      </div>

      {/* 🚀 SEKMELER (TABS) */}
      <div className="bg-white p-1.5 rounded-2xl border border-gray-200 shadow-xs overflow-x-auto custom-scrollbar">
        <div className="flex space-x-1 min-w-[500px] sm:min-w-0">
          {[
            { id: "overview" as const, label: "📊 Genel Bakış", count: null },
            { id: "orders" as const, label: "📋 Siparişler", count: customer.orders.length },
            { id: "addresses" as const, label: "🏠 Adresler", count: customer.addresses.length },
            { id: "returns" as const, label: "🔄 İade & Değişim", count: customer.returns.length + customer.exchanges.length },
            { id: "timeline" as const, label: "⚡ Aktivite Zaman Tüneli", count: customer.timeline.length },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm transition-all min-h-[40px] ${
                  isActive
                    ? "bg-gray-900 text-white shadow-xs"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== null && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${isActive ? "bg-gray-800 text-blue-300" : "bg-gray-100 text-gray-600"}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 🚀 TAB 1: GENEL BAKIŞ */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* PROFİL KARTI */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-3xl bg-blue-600 text-white font-black text-3xl flex items-center justify-center shadow-md mb-3">
                {customer.avatarUrl ? (
                  <img src={customer.avatarUrl} alt={customer.name} className="w-full h-full object-cover rounded-3xl" />
                ) : (
                  initial
                )}
              </div>
              <h3 className="font-black text-gray-900 text-lg">{customer.name}</h3>
              <p className="text-gray-500 text-xs font-medium">{customer.email}</p>
              <span className={`mt-2 text-xs font-black px-3 py-1 rounded-full ${customer.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                {customer.isActive ? "🟢 Aktif Hesap" : "🔴 Pasif / Engelli"}
              </span>
            </div>

            <div className="space-y-3 text-xs border-t border-gray-100 pt-4 font-medium">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Telefon:</span>
                <span className="font-bold text-gray-900">{customer.phone || "Belirtilmedi"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Sistem Rolü:</span>
                <span className="font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">{customer.role}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Kayıt Tarihi:</span>
                <span className="font-bold text-gray-900">{new Date(customer.createdAt).toLocaleDateString("tr-TR")}</span>
              </div>
            </div>
          </div>

          {/* İSTATİSTİKLER VE SON SİPARİŞLER */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs border-l-4 border-l-blue-600">
                <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block mb-0.5">Toplam Harcama</span>
                <p className="text-xl font-black text-blue-600">{customer.totalSpent.toLocaleString("tr-TR")} ₺</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs border-l-4 border-l-emerald-600">
                <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block mb-0.5">Sipariş Sayısı</span>
                <p className="text-xl font-black text-emerald-600">{customer.orders.length} Adet</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs border-l-4 border-l-amber-500">
                <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block mb-0.5">İadeler</span>
                <p className="text-xl font-black text-amber-600">{customer.returns.length} Adet</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs border-l-4 border-l-purple-600">
                <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block mb-0.5">Değişimler</span>
                <p className="text-xl font-black text-purple-600">{customer.exchanges.length} Adet</p>
              </div>
            </div>

            {/* RECENT ORDERS TABLE */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
              <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                <h4 className="font-extrabold text-gray-900 text-sm">Son Sipariş Hareketleri</h4>
                <button onClick={() => setActiveTab("orders")} className="text-xs font-bold text-blue-600 hover:underline">
                  Tümünü Gör →
                </button>
              </div>
              <div className="divide-y divide-gray-100">
                {customer.orders.slice(0, 5).map((ord) => (
                  <div key={ord.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-gray-50 transition">
                    <div>
                      <span className="font-mono font-bold text-gray-900">#{ord.id.slice(-8).toUpperCase()}</span>
                      <span className="text-gray-400 block text-[10px]">{new Date(ord.createdAt).toLocaleDateString("tr-TR")}</span>
                    </div>
                    <span className="font-black text-blue-600">{ord.totalPrice.toLocaleString("tr-TR")} ₺</span>
                    <span className="bg-gray-100 text-gray-700 font-extrabold px-2.5 py-1 rounded-md">{ord.status}</span>
                  </div>
                ))}
                {customer.orders.length === 0 && (
                  <div className="p-8 text-center text-gray-400 text-xs">Henüz sipariş kaydı yok.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🚀 TAB 2: TÜM SİPARİŞLER */}
      {activeTab === "orders" && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-gray-50 text-gray-500 font-extrabold uppercase tracking-wider text-[10px] border-b border-gray-200">
                <tr>
                  <th className="p-3.5">Sipariş No</th>
                  <th className="p-3.5">Tarih</th>
                  <th className="p-3.5">Parça</th>
                  <th className="p-3.5">Tutar</th>
                  <th className="p-3.5">Durum</th>
                  <th className="p-3.5 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {customer.orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-gray-50 transition">
                    <td className="p-3.5 font-mono font-bold text-gray-900">#{ord.id.slice(-8).toUpperCase()}</td>
                    <td className="p-3.5 text-gray-600">{new Date(ord.createdAt).toLocaleDateString("tr-TR")}</td>
                    <td className="p-3.5 text-gray-700 font-bold">{ord.itemsCount} Ürün</td>
                    <td className="p-3.5 font-black text-blue-600">{ord.totalPrice.toLocaleString("tr-TR")} ₺</td>
                    <td className="p-3.5">
                      <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md text-xs font-bold">{ord.status}</span>
                    </td>
                    <td className="p-3.5 text-right">
                      <Link href={`/admin/orders/${ord.id}`} className="text-blue-600 hover:underline font-bold text-xs">
                        İncele ↗
                      </Link>
                    </td>
                  </tr>
                ))}
                {customer.orders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-400">Kayıtlı sipariş bulunamadı.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 🚀 TAB 3: ADRESLER */}
      {activeTab === "addresses" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customer.addresses.map((addr) => (
            <div key={addr.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-1 text-xs">
              <span className="font-extrabold text-gray-900 text-sm block mb-1">🏠 {addr.title}</span>
              <p className="text-gray-600 leading-relaxed">{addr.address}</p>
              <p className="text-gray-400 font-bold mt-2">{addr.district} / {addr.city}</p>
            </div>
          ))}
          {customer.addresses.length === 0 && (
            <div className="col-span-full p-8 text-center bg-white rounded-2xl border border-gray-200 text-gray-400 text-xs">
              Kayıtlı adres bulunmuyor.
            </div>
          )}
        </div>
      )}

      {/* 🚀 TAB 4: İADELER VE DEĞİŞİMLER */}
      {activeTab === "returns" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5 space-y-3">
            <h4 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
              <span>↩️</span> İade Talepleri ({customer.returns.length})
            </h4>
            <div className="divide-y divide-gray-100">
              {customer.returns.map((ret) => (
                <div key={ret.id} className="py-2.5 flex justify-between items-center text-xs">
                  <span className="font-mono font-bold text-gray-900">Sipariş: #{ret.orderId.slice(-8).toUpperCase()}</span>
                  <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold">{ret.status}</span>
                </div>
              ))}
              {customer.returns.length === 0 && <p className="text-xs text-gray-400 py-4">İade kaydı yok.</p>}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5 space-y-3">
            <h4 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
              <span>🔁</span> Değişim Talepleri ({customer.exchanges.length})
            </h4>
            <div className="divide-y divide-gray-100">
              {customer.exchanges.map((exc) => (
                <div key={exc.id} className="py-2.5 flex justify-between items-center text-xs">
                  <span className="font-mono font-bold text-gray-900">Sipariş: #{exc.orderId.slice(-8).toUpperCase()}</span>
                  <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded font-bold">{exc.status}</span>
                </div>
              ))}
              {customer.exchanges.length === 0 && <p className="text-xs text-gray-400 py-4">Değişim kaydı yok.</p>}
            </div>
          </div>
        </div>
      )}

      {/* 🚀 TAB 5: STRIPE BENZERİ MÜŞTERİ AKTİVİTE ZAMAN TÜNELİ (TIMELINE) */}
      {activeTab === "timeline" && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-6">
          <h3 className="font-black text-gray-900 text-base flex items-center gap-2">
            <span>⚡</span> Müşteri Aktivite Zaman Tüneli (Timeline)
          </h3>

          <div className="relative border-l-2 border-gray-200 ml-4 space-y-6">
            {customer.timeline.map((ev) => (
              <div key={ev.id} className="relative pl-6">
                <div className="absolute -left-3 top-0 w-6 h-6 rounded-full bg-white border-2 border-blue-600 flex items-center justify-center text-xs shadow-xs">
                  {ev.icon}
                </div>
                <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-200/80 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${ev.badgeBg}`}>
                      {ev.title}
                    </span>
                    <span className="text-[11px] text-gray-400 font-mono">
                      {new Date(ev.date).toLocaleString("tr-TR")}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-gray-900">{ev.description}</p>
                  {ev.link && (
                    <Link href={ev.link} className="text-xs font-bold text-blue-600 hover:underline inline-block mt-1">
                      Detayı İncele ↗
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
