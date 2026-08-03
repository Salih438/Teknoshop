"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { AdminNotificationType } from "@prisma/client";

interface AdminNotificationItem {
  id: string;
  type: AdminNotificationType;
  title: string;
  message: string;
  link?: string | null;
  isRead: boolean;
  metadata?: string | null;
  createdAt: string;
}

interface ParsedContactMetadata {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  fullMessage?: string;
}

const TYPE_CONFIG: Record<
  AdminNotificationType,
  { icon: string; bg: string; text: string; border: string; label: string }
> = {
  NEW_ORDER: {
    icon: "🛒",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    label: "Sipariş",
  },
  LOW_STOCK: {
    icon: "⚠️",
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    label: "Kritik Stok",
  },
  ORDER_CANCELLED: {
    icon: "🛑",
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    label: "İptal",
  },
  RETURN_REQUEST: {
    icon: "↩️",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    label: "İade",
  },
  EXCHANGE_REQUEST: {
    icon: "🔁",
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
    label: "Değişim",
  },
  SYSTEM: {
    icon: "⚙️",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    label: "Sistem",
  },
  USER_REGISTERED: {
    icon: "👤",
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    border: "border-indigo-200",
    label: "Kullanıcı",
  },
};

export default function AdminNotificationsClient() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // İletişim Detay Modalı State
  const [selectedContactModal, setSelectedContactModal] = useState<{
    item: AdminNotificationItem;
    parsedMetadata: ParsedContactMetadata;
  } | null>(null);

  // Özel Tümünü Sil Onay Modalı State
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) setMounted(true);
    });
    return () => {
      active = false;
    };
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/admin/notifications?filter=${activeFilter}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {
      console.error("Admin notifications fetch error");
    } finally {
      setIsLoading(false);
    }
  }, [activeFilter]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) {
        fetchNotifications();
        setSelectedIds([]);
      }
    });
    return () => {
      active = false;
    };
  }, [fetchNotifications]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(notifications.map((n) => n.id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch("/api/admin/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "markAll" }),
      });
      toast.success("Tüm bildirimler okundu olarak işaretlendi. ✓");
      fetchNotifications();
    } catch {
      toast.error("İşlem başarısız.");
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    try {
      await fetch("/api/admin/notifications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deleteSelected", ids: selectedIds }),
      });
      toast.success(`${selectedIds.length} bildirim silindi.`);
      setSelectedIds([]);
      fetchNotifications();
    } catch {
      toast.error("Silme işlemi başarısız.");
    }
  };

  const confirmDeleteAll = async () => {
    setIsClearAllModalOpen(false);
    try {
      await fetch("/api/admin/notifications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deleteAll" }),
      });
      toast.success("Tüm bildirimler temizlendi. 🧹");
      setSelectedIds([]);
      fetchNotifications();
    } catch {
      toast.error("Temizleme işlemi başarısız.");
    }
  };

  // İncele Butonuna Basıldığında Okundu İşaretleme + Modal / Yönlendirme
  const handleInspect = async (item: AdminNotificationItem) => {
    // 1. Okunmadıysa bildirim durumunu güncelle
    if (!item.isRead) {
      try {
        await fetch("/api/admin/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "markOne", id: item.id }),
        });
        setNotifications((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (e) {
        console.error("Mark read error:", e);
      }
    }

    // 2. İletişim Formu verisi ayrıştırma
    let contactData: ParsedContactMetadata | null = null;

    if (item.metadata) {
      try {
        const parsed = JSON.parse(item.metadata);
        if (parsed && (parsed.type === "CONTACT_FORM" || parsed.email)) {
          contactData = parsed;
        }
      } catch {
        // Metadata JSON formatında değilse fallback kullanır
      }
    }

    if (!contactData && (item.title.includes("İletişim Mesajı") || item.message.includes("E-Posta:"))) {
      const emailMatch = item.message.match(/E-Posta:\s*([^\s)]+)/i);
      const phoneMatch = item.message.match(/Tel:\s*([^\s)]+)/i);
      contactData = {
        name: item.title.replace("📬 İletişim Mesajı:", "").trim(),
        email: emailMatch ? emailMatch[1] : "",
        phone: phoneMatch ? phoneMatch[1] : "",
        subject: "İletişim Mesajı",
        fullMessage: item.message,
      };
    }

    if (contactData) {
      setSelectedContactModal({ item, parsedMetadata: contactData });
      return;
    }

    // 3. Diğer bildirimler için link yönlendirmesi
    if (item.link && item.link !== "/admin/notifications") {
      router.push(item.link);
    }
  };

  return (
    <div className="space-y-6 w-full animate-in fade-in duration-300">
      
      {/* 🚀 BAŞLIK & TOPLU AKSİYONLAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <span>🔔</span> Admin Bildirim Yönetim Merkezi
          </h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-0.5 font-medium">
            Kritik stok uyarısı, sipariş hareketleri, müşteri mesajları ve sistem duyurularını tek ekrandan yönetin.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="bg-blue-50 text-blue-700 hover:bg-blue-100 font-extrabold px-3.5 py-2 rounded-xl text-xs transition shadow-xs flex items-center gap-1.5 min-h-[40px] cursor-pointer"
            >
              <span>✓</span> Tümünü Okundu Yap ({unreadCount})
            </button>
          )}

          {selectedIds.length > 0 && (
            <button
              onClick={handleDeleteSelected}
              className="bg-red-50 text-red-700 hover:bg-red-100 font-extrabold px-3.5 py-2 rounded-xl text-xs transition shadow-xs flex items-center gap-1.5 min-h-[40px] cursor-pointer"
            >
              <span>🗑</span> Seçilenleri Sil ({selectedIds.length})
            </button>
          )}

          <button
            onClick={() => setIsClearAllModalOpen(true)}
            className="bg-gray-100 text-gray-700 hover:bg-gray-200 font-extrabold px-3.5 py-2 rounded-xl text-xs transition shadow-xs flex items-center gap-1.5 min-h-[40px] cursor-pointer"
          >
            <span>🧹</span> Hepsini Temizle
          </button>
        </div>
      </div>

      {/* 🚀 FİLTRE SEKMELERİ */}
      <div className="bg-white p-1.5 rounded-2xl border border-gray-200 shadow-xs overflow-x-auto custom-scrollbar">
        <div className="flex space-x-1 min-w-[520px] sm:min-w-0">
          {[
            { id: "all", label: "Tümü", icon: "🌐" },
            { id: "orders", label: "Siparişler", icon: "🛒" },
            { id: "stock", label: "Kritik Stok", icon: "⚠️" },
            { id: "returns", label: "İade & Değişim", icon: "🔄" },
            { id: "system", label: "Sistem & Kullanıcı", icon: "⚙️" },
          ].map((tab) => {
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm transition-all min-h-[40px] cursor-pointer ${
                  isActive
                    ? "bg-gray-900 text-white shadow-xs"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 🚀 BİLDİRİM TABLOSU & KART LİSTESİ */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-200 overflow-hidden">
        
        {/* TABLO ÜST AKSİYON BAR */}
        <div className="p-4 bg-gray-50/70 border-b border-gray-200 flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedIds.length === notifications.length && notifications.length > 0}
              onChange={handleSelectAll}
              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            Tümünü Seç ({notifications.length})
          </label>
          <span className="text-xs text-gray-500 font-medium">
            {unreadCount} Okunmamış Bildirim
          </span>
        </div>

        <div className="divide-y divide-gray-100">
          {isLoading ? (
            <div className="p-8 space-y-3 animate-pulse">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="h-16 bg-gray-100 rounded-xl" />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center my-4 space-y-3">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center text-3xl mx-auto shadow-xs border border-blue-100">
                🎉
              </div>
              <h4 className="font-extrabold text-gray-900 text-base">Bildirim Bulunmuyor</h4>
              <p className="text-gray-500 text-xs max-w-sm mx-auto font-medium">
                Seçtiğiniz filtreye uygun kayıtlı bildirim bulunmamaktadır.
              </p>
            </div>
          ) : (
            notifications.map((item) => {
              const config = TYPE_CONFIG[item.type] || {
                icon: "🔔",
                bg: "bg-gray-50",
                text: "text-gray-700",
                border: "border-gray-200",
                label: "Bildirim",
              };

              const isSelected = selectedIds.includes(item.id);

              // 🚀 Mesaj Özet Metnini Temizleme (E-Posta/Tel Etiketlerini Ve Konu Başlığını Kart Üzerinde Gizle)
              let cleanMessageSnippet = item.message;
              if (item.metadata || item.title.includes("İletişim Mesajı")) {
                cleanMessageSnippet = cleanMessageSnippet
                  .replace(/\s*\(E-Posta:\s*[^\s)]+\)\s*/gi, "")
                  .replace(/\s*\(Tel:\s*[^\s)]+\)\s*/gi, "")
                  .replace(/^\[[^\]]+\]\s*/, "")
                  .trim();
              }

              return (
                <div
                  key={item.id}
                  className={`p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all duration-200 border-b border-gray-100 last:border-b-0 ${
                    !item.isRead ? "bg-blue-50/30 border-l-4 border-l-blue-600" : "bg-white hover:bg-gray-50/70"
                  }`}
                >
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectOne(item.id)}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 mt-1 sm:mt-2.5 flex-shrink-0 cursor-pointer"
                    />

                    <div
                      className={`w-11 h-11 rounded-2xl border shadow-xs flex items-center justify-center text-xl flex-shrink-0 mt-0.5 ${config.bg} ${config.border} ${config.text}`}
                    >
                      {config.icon}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${config.bg} ${config.text} ${config.border}`}
                        >
                          {config.label}
                        </span>
                        <h4 className="font-extrabold text-gray-900 text-sm leading-snug">{item.title}</h4>
                        {!item.isRead && (
                          <span className="bg-blue-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                            Yeni
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-gray-600 font-medium leading-relaxed line-clamp-1">
                        {cleanMessageSnippet}
                      </p>

                      <span className="text-[11px] text-gray-400 font-mono mt-1.5 flex items-center gap-1.5">
                        <span>🕒</span> {new Date(item.createdAt).toLocaleString("tr-TR")}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleInspect(item)}
                    className="px-4 py-2 bg-gray-900 hover:bg-blue-600 text-white font-extrabold text-xs rounded-xl transition-all shadow-xs flex-shrink-0 self-end sm:self-center min-h-[38px] flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>İncele</span>
                    <span>↗</span>
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 🚀 PREMIUM CONTACT MESSAGE DETAIL MODAL (REACT PORTAL TO DOCUMENT.BODY) */}
      {mounted && selectedContactModal && createPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedContactModal(null);
          }}
          className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none border-none outline-none ring-0 shadow-none"
        >
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative text-left border border-gray-100 animate-in zoom-in-95 duration-200 space-y-6">
            {/* MODAL BAŞLIK VE KAPAT BUTONU */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center text-xl font-bold flex-shrink-0">
                  ✉️
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900 leading-tight">
                    {selectedContactModal.parsedMetadata.name || "İletişim Mesajı"}
                  </h3>
                  <p className="text-xs text-gray-400 font-medium mt-0.5 font-mono">
                    {new Date(selectedContactModal.item.createdAt).toLocaleString("tr-TR")}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedContactModal(null)}
                aria-label="Pencereyi kapat"
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition cursor-pointer w-9 h-9 flex items-center justify-center font-bold text-sm outline-none focus:ring-2 focus:ring-gray-300"
              >
                ✕
              </button>
            </div>

            {/* 3 KOLONLU GÖNDEREN & İLETİŞİM BİLGİ KARTI */}
            <div className="bg-gray-50/80 border border-gray-100 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  E-POSTA ADRESİ
                </span>
                <a
                  href={`mailto:${selectedContactModal.parsedMetadata.email}`}
                  className="text-xs font-bold text-blue-600 hover:underline break-all"
                >
                  {selectedContactModal.parsedMetadata.email || "Belirtilmedi"}
                </a>
              </div>

              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  TELEFON NUMARASI
                </span>
                {selectedContactModal.parsedMetadata.phone ? (
                  <a
                    href={`tel:${selectedContactModal.parsedMetadata.phone}`}
                    className="text-xs font-bold text-emerald-600 hover:underline break-all"
                  >
                    {selectedContactModal.parsedMetadata.phone}
                  </a>
                ) : (
                  <span className="text-xs font-medium text-gray-400">Belirtilmedi</span>
                )}
              </div>

              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  KONU / KATEGORİ
                </span>
                <span className="inline-block bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-md">
                  {selectedContactModal.parsedMetadata.subject || "Genel Destek"}
                </span>
              </div>
            </div>

            {/* TAM MESAJ İÇERİĞİ */}
            {(() => {
              let rawMessage = selectedContactModal.parsedMetadata.fullMessage || selectedContactModal.item.message;
              rawMessage = rawMessage.replace(/\s*\(E-Posta:\s*[^\s)]+\)\s*/gi, "");
              rawMessage = rawMessage.replace(/\s*\(Tel:\s*[^\s)]+\)\s*/gi, "");
              rawMessage = rawMessage.replace(/^\[[^\]]+\]\s*/, "");

              return (
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">
                    MESAJ İÇERİĞİ
                  </span>
                  <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs max-h-[40vh] overflow-y-auto space-y-2 text-sm text-gray-800 leading-relaxed font-normal whitespace-pre-wrap break-words custom-scrollbar">
                    {rawMessage}
                  </div>
                </div>
              );
            })()}

            {/* ALT EYLEM BUTONLARI (DUAL ACTIONS: E-POSTA + TELEFON/WHATSAPP) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setSelectedContactModal(null)}
                className="py-3 px-5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Kapat
              </button>

              <div className="flex flex-wrap items-center gap-2">
                {selectedContactModal.parsedMetadata.phone && (
                  <a
                    href={`tel:${selectedContactModal.parsedMetadata.phone}`}
                    className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl transition shadow-md flex items-center justify-center gap-1.5 text-xs cursor-pointer"
                  >
                    <span>Ara / WhatsApp</span> 📞
                  </a>
                )}
                <a
                  href={`mailto:${selectedContactModal.parsedMetadata.email}?subject=Re: ${encodeURIComponent(selectedContactModal.parsedMetadata.subject || "İletişim Talebi")}`}
                  className="py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl transition shadow-md flex items-center justify-center gap-1.5 text-xs cursor-pointer"
                >
                  <span>E-Posta ile Yanıtla</span> ✉️
                </a>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 🚀 CUSTOM DELETE ALL CONFIRMATION MODAL (REACT PORTAL TO DOCUMENT.BODY) */}
      {mounted && isClearAllModalOpen && createPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsClearAllModalOpen(false);
          }}
          className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none border-none outline-none ring-0 shadow-none"
        >
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative text-center border border-gray-100 animate-in zoom-in-95 duration-200 space-y-5">
            {/* UYARI İKONU */}
            <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto text-2xl border border-red-100 shadow-xs">
              🗑️
            </div>

            {/* METİNLER */}
            <div>
              <h3 className="text-xl font-black text-gray-900 leading-tight">
                Tüm Bildirimleri Sil
              </h3>
              <p className="text-xs text-gray-500 font-medium mt-2 leading-relaxed">
                Tüm bildirim geçmişiniz kalıcı olarak silinecektir. Bu işlem geri alınamaz. Devam etmek istediğinize emin misiniz?
              </p>
            </div>

            {/* EYLEM BUTONLARI */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsClearAllModalOpen(false)}
                className="py-3 px-5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs flex-1 transition cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={confirmDeleteAll}
                className="py-3 px-5 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-xl text-xs flex-1 transition shadow-md cursor-pointer"
              >
                Evet, Tümünü Sil
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
