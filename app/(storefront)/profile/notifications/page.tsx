"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { NOTIFICATION_TYPE_CONFIG } from "@/lib/notificationsData";
import {
  getUserNotificationsAction,
  markNotificationReadAction,
  markAllNotificationsReadAction,
  deleteNotificationAction,
} from "@/actions/user-notification";

type CategoryFilter = "all" | "orders" | "returns" | "campaigns" | "system";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  linkUrl?: string | null;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [activeFilter, setActiveFilter] = useState<CategoryFilter>("all");
  const [loading, setLoading] = useState<boolean>(true);
  const [isPending, startTransition] = useTransition();

  const loadNotifications = async (filter: CategoryFilter) => {
    setLoading(true);
    const res = await getUserNotificationsAction(filter);
    if (res.success && res.data) {
      const formatted = res.data.notifications.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        createdAt: new Date(n.createdAt).toLocaleDateString("tr-TR", {
          day: "numeric",
          month: "long",
          hour: "2-digit",
          minute: "2-digit",
        }),
        isRead: n.isRead,
        linkUrl: n.linkUrl,
      }));
      setNotifications(formatted);
      setUnreadCount(res.data.unreadCount);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadNotifications(activeFilter);
  }, [activeFilter]);

  const markAllAsRead = async () => {
    startTransition(async () => {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      await markAllNotificationsReadAction();
    });
  };

  const toggleReadStatus = async (id: string, currentReadState: boolean) => {
    startTransition(async () => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      if (!currentReadState) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
        await markNotificationReadAction(id);
      }
    });
  };

  const deleteNotification = async (id: string, isUnread: boolean) => {
    startTransition(async () => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (isUnread) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      await deleteNotificationAction(id);
    });
  };

  return (
    <div className="max-w-5xl mx-auto py-6 sm:py-8 px-4 sm:px-6 min-h-screen animate-in fade-in duration-500 w-full overflow-x-clip space-y-6">
      
      {/* BREADCRUMB & BAŞLIK */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4 sm:pb-6">
        <div>
          <div className="text-xs sm:text-sm text-gray-500 mb-2 flex items-center gap-2">
            <Link href="/profile" className="hover:text-blue-600 transition font-medium">
              Hesabım
            </Link>
            <span className="text-gray-300">/</span>
            <span className="text-gray-900 font-bold">Bildirim Merkezi</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
            <span>🔔</span> Bildirim Merkezi
          </h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-1 font-medium">
            Sipariş süreçleri, iade talepleri ve size özel kampanyalardan anında haberdar olun.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            disabled={isPending}
            className="bg-blue-50 text-blue-700 hover:bg-blue-100 font-extrabold px-4 py-2.5 rounded-xl text-xs sm:text-sm transition shadow-xs flex items-center justify-center gap-2 min-h-[44px] self-start sm:self-auto disabled:opacity-50"
          >
            <span>✓</span> Tümünü Okundu İşaretle ({unreadCount})
          </button>
        )}
      </div>

      {/* FİLTRELEME SEKMELERİ */}
      <div className="bg-white p-1.5 rounded-2xl shadow-xs border border-gray-100 overflow-x-auto custom-scrollbar">
        <div className="flex space-x-1 min-w-[500px] sm:min-w-0">
          {[
            { id: "all", label: "Tümü", icon: "🌐" },
            { id: "orders", label: "Siparişler", icon: "📦" },
            { id: "returns", label: "İade & Değişim", icon: "🔄" },
            { id: "campaigns", label: "Kampanyalar", icon: "🎟️" },
            { id: "system", label: "Duyurular", icon: "📢" },
          ].map((tab) => {
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id as CategoryFilter)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-extrabold text-xs sm:text-sm transition-all outline-none min-h-[44px] ${
                  isActive
                    ? "bg-gray-900 text-white shadow-sm"
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

      {/* BİLDİRİM KARTLARI LİSTESİ */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white p-8 sm:p-12 rounded-2xl border border-gray-100 text-center animate-pulse">
            <div className="w-12 h-12 bg-gray-100 rounded-full mx-auto mb-3"></div>
            <div className="h-4 bg-gray-100 rounded w-48 mx-auto"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white p-8 sm:p-12 rounded-2xl sm:rounded-3xl border border-gray-100 shadow-xs text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-3xl">🔕</div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Bildirim Bulunamadı</h3>
            <p className="text-gray-500 text-xs sm:text-sm">Seçili filtreye uygun herhangi bir bildiriminiz bulunmuyor.</p>
          </div>
        ) : (
          notifications.map((notif) => {
            const cfg = NOTIFICATION_TYPE_CONFIG[notif.type] || NOTIFICATION_TYPE_CONFIG.SYSTEM_ANNOUNCEMENT;

            return (
              <div
                key={notif.id}
                className={`bg-white p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
                  !notif.isRead ? "border-blue-200 bg-blue-50/20 shadow-xs ring-1 ring-blue-500/10" : "border-gray-100 hover:border-gray-200"
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center text-xl flex-shrink-0 mt-0.5 ${cfg.bgClass}`}>
                    {cfg.icon}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-extrabold text-gray-900 text-sm sm:text-base leading-snug">{notif.title}</h4>
                      {!notif.isRead && (
                        <span className="bg-blue-600 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Yeni
                        </span>
                      )}
                    </div>

                    <p className="text-gray-600 text-xs sm:text-sm mt-1 leading-relaxed">{notif.message}</p>
                    <span className="text-[11px] text-gray-400 font-medium mt-1.5 block">{notif.createdAt}</span>
                  </div>
                </div>

                {/* SAĞ AKSİYONLAR */}
                <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0 pt-2 sm:pt-0 border-t border-gray-100 sm:border-none w-full sm:w-auto justify-end">
                  {notif.linkUrl && (
                    <Link
                      href={notif.linkUrl}
                      onClick={() => toggleReadStatus(notif.id, notif.isRead)}
                      className="bg-gray-900 text-white font-extrabold px-3.5 py-2 rounded-xl text-xs hover:bg-gray-800 transition min-h-[38px] inline-flex items-center gap-1"
                    >
                      <span>İncele</span> ➔
                    </Link>
                  )}

                  <button
                    onClick={() => toggleReadStatus(notif.id, notif.isRead)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition border border-transparent hover:border-blue-100 min-h-[38px] min-w-[38px] flex items-center justify-center"
                    title={notif.isRead ? "Okundu" : "Okundu İşaretle"}
                  >
                    {notif.isRead ? "✉️" : "✓"}
                  </button>

                  <button
                    onClick={() => deleteNotification(notif.id, !notif.isRead)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition border border-transparent hover:border-red-100 min-h-[38px] min-w-[38px] flex items-center justify-center"
                    title="Sil"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
