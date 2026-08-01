"use client";

import { useState, useEffect, KeyboardEvent, ComponentProps } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import OrderProgressBar from "@/components/profile/OrderProgressBar";
import AddressManager from "@/components/profile/AddressManager";
import EditProfileModal from "@/components/profile/EditProfileModal";
import ReturnStatusCard from "@/components/profile/ReturnStatusCard";
import ExchangeStatusCard from "@/components/profile/ExchangeStatusCard";

export type OrderItemWithProduct = {
  id: string;
  quantity: number;
  product?: { name: string } | null;
};

export type OrderDetail = {
  id: string;
  createdAt: Date | string;
  totalPrice: number;
  status: string;
  items: OrderItemWithProduct[];
};

export type AddressItem = {
  id: string;
  title: string;
  city: string;
  district: string;
  address: string;
  isDefault: boolean;
};

interface ProfileTabContainerProps {
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    createdAt: Date | string;
  };
  orders: OrderDetail[];
  addresses: AddressItem[];
  returns?: ComponentProps<typeof ReturnStatusCard>["returnRequest"][];
  exchanges?: ComponentProps<typeof ExchangeStatusCard>["exchangeRequest"][];
}

type TabType = "overview" | "orders" | "returns" | "addresses" | "settings";

const TABS: { id: TabType; label: string; icon: string }[] = [
  { id: "overview", label: "Genel Bakış", icon: "📊" },
  { id: "orders", label: "Siparişlerim", icon: "📦" },
  { id: "returns", label: "İade & Değişimlerim", icon: "↩️" },
  { id: "addresses", label: "Adreslerim", icon: "📍" },
  { id: "settings", label: "Hesap Ayarları", icon: "⚙️" },
];

export default function ProfileTabContainer({
  user,
  orders,
  addresses,
  returns = [],
  exchanges = [],
}: ProfileTabContainerProps) {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") as TabType | null;

  const [activeTab, setActiveTab] = useState<TabType>(() => {
    if (tabParam && ["overview", "orders", "returns", "addresses", "settings"].includes(tabParam)) {
      return tabParam;
    }
    return "overview";
  });

  useEffect(() => {
    if (tabParam && ["overview", "orders", "returns", "addresses", "settings"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
    let nextIndex = currentIndex;
    if (e.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % TABS.length;
    } else if (e.key === "ArrowLeft") {
      nextIndex = (currentIndex - 1 + TABS.length) % TABS.length;
    } else if (e.key === "Home") {
      nextIndex = 0;
    } else if (e.key === "End") {
      nextIndex = TABS.length - 1;
    } else {
      return;
    }
    e.preventDefault();
    const nextTab = TABS[nextIndex].id;
    setActiveTab(nextTab);
    const targetBtn = document.getElementById(`tab-${nextTab}`);
    targetBtn?.focus();
  };

  const recentOrders = orders.slice(0, 3);

  return (
    <div className="space-y-6">
      
      {/* SEKMELİ GEZİNME ÇUBUĞU (TAB NAVIGATION) */}
      <div className="bg-white p-1.5 rounded-2xl shadow-xs border border-gray-100 overflow-x-auto custom-scrollbar">
        <div 
          role="tablist" 
          aria-label="Profil Sekmeleri"
          className="flex space-x-1 min-w-[400px] sm:min-w-0"
        >
          {TABS.map((tab, idx) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                role="tab"
                aria-selected={isActive}
                aria-controls={`tabpanel-${tab.id}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => setActiveTab(tab.id)}
                onKeyDown={(e) => handleKeyDown(e, idx)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-extrabold text-xs sm:text-sm transition-all outline-none focus-visible:ring-2 focus-visible:ring-blue-600 min-h-[44px] ${
                  isActive
                    ? "bg-gray-900 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.id === "orders" && orders.length > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isActive ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-700"}`}>
                    {orders.length}
                  </span>
                )}
                {tab.id === "returns" && (returns.length > 0 || exchanges.length > 0) && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isActive ? "bg-amber-500 text-white" : "bg-gray-100 text-gray-700"}`}>
                    {returns.length + exchanges.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 🚀 SEKME 1: GENEL BAKIŞ */}
      <div
        id="tabpanel-overview"
        role="tabpanel"
        aria-labelledby="tab-overview"
        hidden={activeTab !== "overview"}
        className="space-y-6 animate-in fade-in duration-300"
      >
        {/* HOŞ GELDİNİZ KARTI */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-md text-white">
          <h3 className="text-xl sm:text-2xl font-black mb-2">Hoş geldiniz, {user.name}! 🎉</h3>
          <p className="text-blue-100 text-xs sm:text-sm max-w-xl font-medium leading-relaxed">
            Hesabınız aktif ve güvendedir. Tüm siparişlerinizi, kayıtlı teslimat adreslerinizi ve hesap ayarlarınızı sekmelerden kolayca yönetebilirsiniz.
          </p>
        </div>

        {/* SON 3 SİPARİŞ ÖZETİ */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-xs border border-gray-100 space-y-6">
          <div className="flex justify-between items-center border-b border-gray-100 pb-4">
            <h3 className="text-lg sm:text-xl font-extrabold text-gray-900 flex items-center gap-2">
              <span>📦</span> Son Siparişleriniz
            </h3>
            {orders.length > 3 && (
              <button
                onClick={() => setActiveTab("orders")}
                className="text-xs sm:text-sm font-extrabold text-blue-600 hover:text-blue-800 transition"
              >
                Tümünü Gör ({orders.length}) &rarr;
              </button>
            )}
          </div>

          {recentOrders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-xs sm:text-sm mb-4">Henüz verilmiş bir siparişiniz bulunmuyor.</p>
              <Link href="/products" className="inline-flex items-center justify-center bg-gray-900 text-white font-extrabold px-6 py-2.5 rounded-xl text-xs sm:text-sm min-h-[44px]">
                Ürünleri İncele
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div key={order.id} className="bg-gray-50 p-4 sm:p-5 rounded-2xl border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <span className="font-mono font-bold text-xs text-gray-900">#{order.id.slice(-8).toUpperCase()}</span>
                    <p className="text-xs text-gray-500 mt-0.5">{new Date(order.createdAt).toLocaleDateString("tr-TR")}</p>
                    <p className="text-xs font-bold text-gray-800 mt-1">
                      {order.items.map(i => i.product?.name).filter(Boolean).join(", ") || "Sipariş İçeriği"}
                    </p>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 pt-2 sm:pt-0 border-t border-gray-200/60 sm:border-none">
                    <span className="font-black text-blue-600 text-sm">{order.totalPrice.toLocaleString("tr-TR")} ₺</span>
                    <Link
                      href={`/profile/orders/${order.id}`}
                      className="bg-white border border-gray-200 text-gray-800 font-extrabold px-4 py-2 rounded-xl text-xs hover:bg-gray-100 transition min-h-[38px] inline-flex items-center"
                    >
                      Detay ➔
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 🚀 SEKME 2: SİPARİŞLERİM */}
      <div
        id="tabpanel-orders"
        role="tabpanel"
        aria-labelledby="tab-orders"
        hidden={activeTab !== "orders"}
        className="space-y-6 animate-in fade-in duration-300"
      >
        <div className="bg-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-xs border border-gray-100">
          <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900 flex items-center gap-3 border-b border-gray-100 pb-4 mb-6">
            <span className="bg-blue-50 text-blue-600 p-2 rounded-xl">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
            </span>
            Sipariş Geçmişim
          </h3>

          {orders.length === 0 ? (
            <div className="p-8 sm:p-12 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-2xl">📦</div>
              <h4 className="text-lg font-bold text-gray-900 mb-2">Henüz Siparişiniz Yok</h4>
              <p className="text-gray-500 text-xs sm:text-sm mb-6">Vitrin&apos;deki teknoloji ürünleri sizi bekliyor.</p>
              <Link href="/products" className="inline-flex items-center justify-center bg-gray-900 text-white font-extrabold px-6 py-3 rounded-xl hover:bg-gray-800 transition shadow-xs text-xs sm:text-sm min-h-[44px]">
                Alışverişe Başla
              </Link>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              {orders.map((order) => (
                <div key={order.id} className="bg-white p-4 sm:p-8 rounded-2xl sm:rounded-3xl shadow-xs border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6 border-b border-gray-100 pb-4 sm:pb-6">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-12 w-full sm:w-auto text-xs sm:text-sm">
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase font-extrabold tracking-widest mb-0.5">Sipariş No</p>
                        <p className="font-mono font-bold text-gray-900">#{order.id.slice(-8).toUpperCase()}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase font-extrabold tracking-widest mb-0.5">Tarih</p>
                        <p className="font-bold text-gray-900">{new Date(order.createdAt).toLocaleDateString("tr-TR")}</p>
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <p className="text-[10px] text-gray-400 uppercase font-extrabold tracking-widest mb-0.5">Tutar</p>
                        <p className="font-extrabold text-blue-600 text-sm sm:text-base">{order.totalPrice.toLocaleString("tr-TR")} ₺</p>
                      </div>
                    </div>
                    
                    <div className="w-full sm:w-auto">
                      <Link href={`/profile/orders/${order.id}`} className="flex items-center justify-center gap-2 w-full bg-blue-50 text-blue-700 font-extrabold px-5 py-2.5 rounded-xl hover:bg-blue-100 transition-colors text-xs sm:text-sm min-h-[44px]">
                        Sipariş Detayı ➔
                      </Link>
                    </div>
                  </div>

                  <div className="mb-4 sm:mb-6">
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {order.items.map(item => (
                        <span key={item.id} className="bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-xl text-xs text-gray-800 font-bold flex items-center gap-1.5">
                          <span className="truncate max-w-[140px] sm:max-w-xs">{item.product?.name || "Silinmiş Ürün"}</span>
                          <span className="bg-gray-200 text-gray-600 px-1 py-0.5 rounded text-[10px]">x{item.quantity}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <OrderProgressBar status={order.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 🚀 SEKME: İADE VE DEĞİŞİMLERİM */}
      <div
        id="tabpanel-returns"
        role="tabpanel"
        aria-labelledby="tab-returns"
        hidden={activeTab !== "returns"}
        className="space-y-6 animate-in fade-in duration-300"
      >
        <div className="bg-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-xs border border-gray-100">
          <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900 flex items-center gap-3 border-b border-gray-100 pb-4 mb-6">
            <span className="bg-amber-50 text-amber-600 p-2 rounded-xl">↩️</span>
            İade &amp; Değişim Taleplerim
          </h3>

          {returns.length === 0 && exchanges.length === 0 ? (
            <div className="p-8 sm:p-12 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-4 text-2xl">🔄</div>
              <h4 className="text-lg font-bold text-gray-900 mb-2">Henüz İade veya Değişim Talebiniz Yok</h4>
              <p className="text-gray-500 text-xs sm:text-sm mb-6">
                Teslim edilmiş siparişleriniz için 14 gün içerisinde iade veya değişim talebi oluşturabilirsiniz.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab("orders")}
                className="inline-flex items-center justify-center bg-gray-900 text-white font-extrabold px-6 py-3 rounded-xl hover:bg-gray-800 transition shadow-xs text-xs sm:text-sm min-h-[44px]"
              >
                Siparişlerime Git
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {returns.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-xs sm:text-sm font-extrabold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                    <span>↩️</span> İade Taleplerim ({returns.length})
                  </h4>
                  <div className="space-y-4">
                    {returns.map((returnReq) => (
                      <ReturnStatusCard key={returnReq.id} returnRequest={returnReq} />
                    ))}
                  </div>
                </div>
              )}

              {exchanges.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-xs sm:text-sm font-extrabold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                    <span>🔄</span> Değişim Taleplerim ({exchanges.length})
                  </h4>
                  <div className="space-y-4">
                    {exchanges.map((exchangeReq) => (
                      <ExchangeStatusCard key={exchangeReq.id} exchangeRequest={exchangeReq} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 🚀 SEKME 3: ADRESLERİM */}
      <div
        id="tabpanel-addresses"
        role="tabpanel"
        aria-labelledby="tab-addresses"
        hidden={activeTab !== "addresses"}
        className="space-y-6 animate-in fade-in duration-300"
      >
        <AddressManager initialAddresses={addresses} />
      </div>

      {/* 🚀 SEKME 4: HESAP AYARLARI */}
      <div
        id="tabpanel-settings"
        role="tabpanel"
        aria-labelledby="tab-settings"
        hidden={activeTab !== "settings"}
        className="space-y-6 animate-in fade-in duration-300"
      >
        <div className="bg-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-xs border border-gray-100 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-4">
            <div>
              <h3 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
                <span>⚙️</span> Kişisel Bilgiler & Ayarlar
              </h3>
              <p className="text-xs text-gray-500 mt-1 font-medium">Hesap bilgilerinizi kontrol edebilir ve güncelleyebilirsiniz.</p>
            </div>
            <EditProfileModal initialName={user.name} initialPhone={user.phone || null} email={user.email} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block mb-1">Ad Soyad</span>
              <p className="font-extrabold text-gray-900 text-base">{user.name}</p>
            </div>

            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block mb-1">E-Posta Adresi</span>
              <p className="font-extrabold text-gray-900 text-base">{user.email}</p>
            </div>

            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block mb-1">Telefon Numarası</span>
              <p className="font-extrabold text-gray-900 text-base">{user.phone || "Eklenmemiş"}</p>
            </div>

            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block mb-1">Hesap Oluşturma Tarihi</span>
              <p className="font-extrabold text-gray-900 text-base">{new Date(user.createdAt).toLocaleDateString("tr-TR")}</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
