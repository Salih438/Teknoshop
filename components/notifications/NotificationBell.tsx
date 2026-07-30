"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { NOTIFICATION_TYPE_CONFIG } from "@/lib/notificationsData";
import {
  getUserNotificationsAction,
  markNotificationReadAction,
  markAllNotificationsReadAction,
} from "@/actions/user-notification";

interface BellNotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  linkUrl?: string | null;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<BellNotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadNotifications = async () => {
    const res = await getUserNotificationsAction("all");
    if (res.success && res.data) {
      const formatted = res.data.notifications.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        createdAt: new Date(n.createdAt).toLocaleDateString("tr-TR", {
          day: "numeric",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        }),
        isRead: n.isRead,
        linkUrl: n.linkUrl,
      }));
      setNotifications(formatted);
      setUnreadCount(res.data.unreadCount);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const toggleOpen = () => {
    setIsOpen((prev) => !prev);
    if (!isOpen) {
      loadNotifications();
    }
  };

  const close = () => setIsOpen(false);

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    await markAllNotificationsReadAction();
  };

  const handleMarkAsRead = async (id: string, isAlreadyRead: boolean) => {
    if (!isAlreadyRead) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      await markNotificationReadAction(id);
    }
  };

  // Dışarı tıklamada kapatma
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        close();
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // ESC Tuşunda Kapatma
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      
      {/* 🔔 BİLDİRİM ZİLİ BUTONU (44px Hitbox) */}
      <button
        onClick={toggleOpen}
        aria-expanded={isOpen}
        aria-label="Bildirimler"
        title="Bildirimler"
        className="hover:text-blue-600 transition-colors flex items-center justify-center p-2 rounded-xl hover:bg-blue-50/50 text-gray-600 group min-h-[44px] min-w-[44px] relative focus-visible:ring-2 focus-visible:ring-blue-600 outline-none"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-gray-600 group-hover:text-blue-600 transition-colors flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-extrabold h-4.5 w-4.5 min-w-[18px] flex items-center justify-center rounded-full ring-2 ring-white shadow-sm animate-in zoom-in duration-200">
            {unreadCount}
          </span>
        )}
      </button>

      {/* MOBİL BOTTOM SHEET OVERLAY */}
      {isOpen && (
        <div
          onClick={close}
          className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm lg:hidden animate-in fade-in duration-200"
        />
      )}

      {/* 🚀 MASAÜSTÜ DROPDOWN & MOBİL BOTTOM SHEET KATMANI */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Bildirimler Paneli"
          className={`
            z-50 bg-white shadow-2xl border border-gray-100 flex flex-col transition-all duration-200
            fixed bottom-0 inset-x-0 rounded-t-3xl max-h-[85vh] w-full lg:static
            lg:absolute lg:top-full lg:right-0 lg:mt-2 lg:w-96 lg:rounded-2xl lg:max-h-[520px] lg:shadow-xl
          `}
        >
          {/* KATMAN BAŞLIĞI */}
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/80 rounded-t-3xl lg:rounded-t-2xl">
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-gray-900 text-sm sm:text-base">Bildirimler</h3>
              {unreadCount > 0 && (
                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-bold">
                  {unreadCount} yeni
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-800 transition"
                >
                  Tümünü Okundu Say
                </button>
              )}
              <button
                onClick={close}
                className="w-7 h-7 bg-gray-200/80 hover:bg-gray-300 rounded-full flex items-center justify-center font-bold text-xs text-gray-600 lg:hidden"
              >
                ✕
              </button>
            </div>
          </div>

          {/* BİLDİRİM LİSTESİ */}
          <div className="divide-y divide-gray-100 overflow-y-auto custom-scrollbar flex-1 max-h-[60vh] lg:max-h-[380px]">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-xs sm:text-sm">
                Henüz bildiriminiz yok.
              </div>
            ) : (
              notifications.slice(0, 5).map((notif) => {
                const cfg = NOTIFICATION_TYPE_CONFIG[notif.type] || NOTIFICATION_TYPE_CONFIG.SYSTEM_ANNOUNCEMENT;

                return (
                  <div
                    key={notif.id}
                    onClick={() => handleMarkAsRead(notif.id, notif.isRead)}
                    className={`p-3.5 flex items-start gap-3 hover:bg-gray-50 transition cursor-pointer relative ${
                      !notif.isRead ? "bg-blue-50/30" : ""
                    }`}
                  >
                    {!notif.isRead && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 absolute top-4 right-3 flex-shrink-0" />
                    )}

                    <div className={`w-9 h-9 rounded-xl border flex items-center justify-center text-lg flex-shrink-0 ${cfg.bgClass}`}>
                      {cfg.icon}
                    </div>

                    <div className="flex-1 min-w-0 pr-2">
                      <p className="font-bold text-gray-900 text-xs sm:text-sm leading-snug truncate">
                        {notif.title}
                      </p>
                      <p className="text-gray-500 text-xs mt-0.5 line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>
                      <span className="text-[10px] text-gray-400 mt-1 block font-medium">
                        {notif.createdAt}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* ALT GEZİNTİ BUTONU */}
          <div className="p-3 border-t border-gray-100 bg-gray-50/50 rounded-b-3xl lg:rounded-b-2xl">
            <Link
              href="/profile/notifications"
              onClick={close}
              className="block w-full text-center bg-gray-900 hover:bg-gray-800 text-white font-extrabold py-2.5 rounded-xl text-xs sm:text-sm transition min-h-[44px] flex items-center justify-center"
            >
              Tüm Bildirimleri Gör ➔
            </Link>
          </div>

        </div>
      )}
    </div>
  );
}
