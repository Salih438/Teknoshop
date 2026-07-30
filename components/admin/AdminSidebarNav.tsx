"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AdminNotificationBell from "./AdminNotificationBell";

const NAV_LINKS = [
  { href: "/admin", label: "📊 Dashboard" },
  { href: "/admin/analytics", label: "📈 Analiz & Raporlar" },
  { href: "/admin/notifications", label: "🔔 Bildirimler" },
  { href: "/admin/audit", label: "🛡️ Denetim İzleri (Audit)" },
  { href: "/admin/roles", label: "🔐 Rol & İzinler (RBAC)" },
  { href: "/admin/products", label: "📦 Ürünler" },
  { href: "/admin/categories", label: "🏷️ Kategoriler" },
  { href: "/admin/brands", label: "🏭 Markalar" },
  { href: "/admin/orders", label: "📋 Siparişler" },
  { href: "/admin/returns", label: "🔄 İade Yönetimi" },
  { href: "/admin/exchanges", label: "🔁 Ürün Değişimleri" },
  { href: "/admin/users", label: "👥 Kullanıcılar" },
  { href: "/admin/payment-methods", label: "💳 Ödeme Yöntemleri" },
  { href: "/admin/coupons", label: "🎟️ Kupon Yönetimi" },
  { href: "/admin/settings", label: "⚙️ Mağaza Ayarları" },
];

export default function AdminSidebarNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const toggleDrawer = () => setIsOpen((prev) => !prev);
  const closeDrawer = () => setIsOpen(false);

  return (
    <>
      {/* 🚀 MOBİL ÜST BAR (Yalnızca Mobilde Görünür) */}
      <div className="md:hidden bg-gray-900 text-white p-4 flex items-center justify-between sticky top-0 z-40 shadow-md">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold tracking-wider">YÖNETİM</h2>
          <span className="text-[10px] bg-gray-800 text-blue-400 px-2 py-0.5 rounded font-mono">v1.0</span>
        </div>
        
        <div className="flex items-center gap-2">
          <AdminNotificationBell />
          <button
            onClick={toggleDrawer}
            className="p-2 bg-gray-800 hover:bg-gray-700 rounded-xl text-white font-bold flex items-center gap-2 text-xs transition min-h-[40px]"
            aria-label="Admin Menüsünü Aç"
          >
            <span>{isOpen ? "✕ Kapat" : "☰ Menü"}</span>
          </button>
        </div>
      </div>

      {/* 🚀 MOBİL SLIDE DRAWER OVERLAY */}
      {isOpen && (
        <div
          onClick={closeDrawer}
          className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm md:hidden animate-in fade-in duration-200"
        />
      )}

      {/* 🚀 SIDEBAR (Masaüstünde Sabit, Mobilde Kayar Drawer) */}
      <aside
        className={`bg-gray-900 text-white flex flex-col z-50 transition-all duration-300 ${
          isOpen
            ? "fixed inset-y-0 left-0 w-72 shadow-2xl md:static md:w-64 md:shadow-none"
            : "hidden md:flex md:w-64 flex-shrink-0"
        }`}
      >
        {/* MASAÜSTÜ BAŞLIK VE 🔔 ADMİN BİLDİRİM ZİLİ */}
        <div className="p-5 border-b border-gray-800 hidden md:flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black tracking-wider text-blue-400">TEKNOSHOP</h2>
            <p className="text-gray-400 text-xs mt-0.5 font-medium">Enterprise Control Panel v1.0</p>
          </div>
          <AdminNotificationBell />
        </div>

        {/* MENÜ LİNKLERİ */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeDrawer}
                className={`block px-4 py-3 rounded-xl transition text-sm font-medium ${
                  isActive
                    ? "bg-blue-600 text-white font-bold shadow-md"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* ALT ÇIKIŞ / VİTRİNE DÖN BUTONU */}
        <div className="p-4 border-t border-gray-800">
          <Link
            href="/"
            onClick={closeDrawer}
            className="block text-center px-4 py-2.5 bg-red-600 hover:bg-red-700 rounded-xl text-white font-bold transition text-sm shadow-sm"
          >
            Vitrine Dön
          </Link>
        </div>
      </aside>
    </>
  );
}
