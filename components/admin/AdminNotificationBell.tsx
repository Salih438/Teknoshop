"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { AdminNotificationType } from "@prisma/client";

interface AdminNotificationItem {
  id: string;
  type: AdminNotificationType;
  title: string;
  message: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
}

interface GroupedNotifications {
  today: AdminNotificationItem[];
  yesterday: AdminNotificationItem[];
  thisWeek: AdminNotificationItem[];
  older: AdminNotificationItem[];
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

export default function AdminNotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [grouped, setGrouped] = useState<GroupedNotifications>({
    today: [],
    yesterday: [],
    thisWeek: [],
    older: [],
  });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isFetchingRef = useRef(false);

  const fetchNotifications = useCallback(async () => {
    if (isFetchingRef.current) return true;
    isFetchingRef.current = true;

    try {
      const res = await fetch("/api/admin/notifications");

      if (res.status === 401 || res.status === 403) {
        return false;
      }

      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.unreadCount || 0);
        setGrouped(data.grouped || { today: [], yesterday: [], thisWeek: [], older: [] });
      }
    } catch (error) {
      console.error("Admin notification fetch error:", error);
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
    return true;
  }, []);

  useEffect(() => {
    let isSubscribed = true;
    let timerId: NodeJS.Timeout | null = null;

    const poll = async () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        return;
      }

      const continuePolling = await fetchNotifications();
      if (!continuePolling && timerId) {
        clearInterval(timerId);
      }
    };

    Promise.resolve().then(() => {
      if (isSubscribed) {
        fetchNotifications();
      }
    });

    timerId = setInterval(() => {
      if (isSubscribed) {
        poll();
      }
    }, 30000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && isSubscribed) {
        fetchNotifications();
      }
    };

    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }

    return () => {
      isSubscribed = false;
      if (timerId) clearInterval(timerId);
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      }
    };
  }, [fetchNotifications]);

  const toggleOpen = () => setIsOpen((prev) => !prev);
  const close = () => setIsOpen(false);

  const handleMarkAllRead = async () => {
    try {
      await fetch("/api/admin/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "markAll" }),
      });
      fetchNotifications();
    } catch (error) {
      console.error("Mark all read error:", error);
    }
  };

  const handleMarkOneRead = async (id: string) => {
    try {
      await fetch("/api/admin/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "markOne", id }),
      });
      fetchNotifications();
    } catch (error) {
      console.error("Mark one read error:", error);
    }
  };

  // ESC & Dışarı tıklamada kapatma
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        close();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const renderNotifCard = (item: AdminNotificationItem) => {
    const config = TYPE_CONFIG[item.type] || {
      icon: "🔔",
      bg: "bg-gray-50",
      text: "text-gray-700",
      border: "border-gray-200",
      label: "Bildirim",
    };

    const formattedTime = new Date(item.createdAt).toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const cleanSnippet = item.message
      .replace(/\s*\(E-Posta:\s*[^\s)]+\)\s*/gi, "")
      .replace(/\s*\(Tel:\s*[^\s)]+\)\s*/gi, "")
      .replace(/^\[[^\]]+\]\s*/, "")
      .trim();

    return (
      <div
        key={item.id}
        onClick={() => handleMarkOneRead(item.id)}
        className={`p-3 rounded-2xl border transition-all duration-200 cursor-pointer relative group flex items-start gap-3 ${
          !item.isRead
            ? "bg-blue-50/40 border-blue-200/80 shadow-xs border-l-4 border-l-blue-600 hover:bg-blue-50/70"
            : "bg-white border-gray-100 hover:bg-gray-50 hover:shadow-xs"
        }`}
      >
        {!item.isRead && (
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 absolute top-3.5 right-3 flex-shrink-0 animate-pulse" />
        )}

        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0 border shadow-xs ${config.bg} ${config.border} ${config.text}`}
        >
          {config.icon}
        </div>

        <div className="flex-1 min-w-0 pr-3">
          <div className="flex items-center gap-1.5">
            <span
              className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${config.bg} ${config.text} ${config.border}`}
            >
              {config.label}
            </span>
            <span className="text-[10px] text-gray-400 font-mono">{formattedTime}</span>
          </div>

          <h4 className="font-extrabold text-gray-900 text-xs mt-1 leading-snug truncate">
            {item.title}
          </h4>

          <p className="text-gray-600 text-xs mt-0.5 line-clamp-1 leading-relaxed font-medium">
            {cleanSnippet}
          </p>
        </div>
      </div>
    );
  };

  const renderNotifSection = (title: string, list: AdminNotificationItem[]) => {
    if (!list || list.length === 0) return null;
    return (
      <div className="space-y-2">
        <div className="px-1 flex items-center justify-between">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            {title}
          </span>
          <span className="text-[10px] font-extrabold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
            {list.length}
          </span>
        </div>
        <div className="space-y-2">{list.map((item) => renderNotifCard(item))}</div>
      </div>
    );
  };

  const hasAnyNotif =
    grouped.today.length > 0 ||
    grouped.yesterday.length > 0 ||
    grouped.thisWeek.length > 0 ||
    grouped.older.length > 0;

  const displayBadgeCount = unreadCount > 99 ? "99+" : unreadCount;

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* 🔔 SHOPIFY / STRIPE TARZI MODERN BİLDİRİM ÇANI */}
      <button
        onClick={toggleOpen}
        aria-expanded={isOpen}
        aria-label="Admin Bildirimleri"
        title="Admin Bildirim Merkezi"
        className="w-10 h-10 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-center text-gray-700 transition relative focus-visible:ring-2 focus-visible:ring-blue-600 outline-none shadow-xs group cursor-pointer"
      >
        <span className="text-lg transition group-hover:scale-110">🔔</span>

        {unreadCount > 0 && (
          <>
            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-extrabold h-5 w-5 min-w-[20px] flex items-center justify-center rounded-full ring-2 ring-white shadow-md animate-in zoom-in duration-200 z-10">
              {displayBadgeCount}
            </span>
            <span className="absolute -top-1 -right-1 bg-red-500 rounded-full h-5 w-5 animate-ping opacity-75" />
          </>
        )}
      </button>

      {/* MOBİL BACKDROP OVERLAY */}
      {isOpen && (
        <div
          onClick={close}
          className="fixed inset-0 bg-black/60 z-40 backdrop-blur-xs sm:hidden animate-in fade-in duration-200"
        />
      )}

      {/* 🚀 RESPONSIVE POPOVER (DESKTOP: SIDEBAR KANAT DROPDOWN / MOBILE: BOTTOM SHEET) */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Admin Bildirim Merkezi"
          className={`
            z-[999] bg-white/95 backdrop-blur-md shadow-2xl border border-gray-200 flex flex-col transition-all duration-200 ease-out
            fixed inset-x-0 bottom-0 rounded-t-3xl max-h-[80vh] w-full p-4 sm:p-5 sm:space-y-4
            sm:absolute sm:bottom-auto sm:top-0 sm:left-full sm:ml-3 sm:w-96 sm:rounded-3xl sm:max-h-[560px]
            animate-in slide-in-from-bottom sm:slide-in-from-left-2 duration-200
          `}
        >
          {/* HEADER ROW */}
          <div className="pb-3 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-base">🔔</span>
              <h3 className="font-black text-gray-900 text-sm flex items-center gap-2">
                Bildirim Merkezi
              </h3>
              {unreadCount > 0 && (
                <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-xs">
                  {unreadCount} Okunmamış
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[11px] font-extrabold text-blue-600 hover:text-blue-800 transition bg-blue-50 px-2 py-0.5 rounded-md cursor-pointer"
                >
                  Tümünü Okundu Yap
                </button>
              )}
              <button
                onClick={close}
                className="w-7 h-7 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center font-bold text-xs text-gray-500 sm:hidden cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>

          {/* NOTIFICATION LIST PREVIEW */}
          <div className="py-2 overflow-y-auto custom-scrollbar flex-1 space-y-3 max-h-60 sm:max-h-80 pr-1">
            {loading ? (
              <div className="space-y-3 animate-pulse">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <div key={idx} className="p-3 bg-gray-100 rounded-2xl h-16 flex gap-3">
                    <div className="w-9 h-9 bg-gray-200 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-gray-200 rounded w-1/3" />
                      <div className="h-3 bg-gray-200 rounded w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : !hasAnyNotif ? (
              <div className="p-6 text-center space-y-2">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-2xl mx-auto shadow-xs border border-blue-100">
                  🎉
                </div>
                <h4 className="font-extrabold text-gray-900 text-xs sm:text-sm">Her Şey Yolunda!</h4>
                <p className="text-gray-500 text-[11px] max-w-xs mx-auto font-medium leading-relaxed">
                  Şu an için ilgilenmeniz gereken yeni bildirim bulunmuyor.
                </p>
              </div>
            ) : (
              <>
                {renderNotifSection("Bugün", grouped.today)}
                {renderNotifSection("Dün", grouped.yesterday)}
                {renderNotifSection("Bu Hafta", grouped.thisWeek)}
                {renderNotifSection("Daha Eski", grouped.older)}
              </>
            )}
          </div>

          {/* FOOTER NAVIGATION ACTION */}
          <div className="pt-3 border-t border-gray-100 flex-shrink-0">
            <Link
              href="/admin/notifications"
              onClick={close}
              className="w-full py-3 bg-gray-900 hover:bg-blue-600 text-white font-extrabold text-xs rounded-xl transition flex justify-center items-center gap-2 active:scale-98 shadow-xs cursor-pointer"
            >
              <span>Tüm Bildirimleri Yönet</span>
              <span>➔</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
