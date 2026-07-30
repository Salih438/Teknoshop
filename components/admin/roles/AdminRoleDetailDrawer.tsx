"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export interface AdminRoleDetailDrawerData {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  systemRole: "SUPER_ADMIN" | "ADMIN" | "CUSTOMER_SUPPORT" | "CONTENT_MANAGER" | "ANALYST";
  isActive: boolean;
  createdAt: string;
  permissions: string[];
}

interface AdminRoleDetailDrawerProps {
  admin: AdminRoleDetailDrawerData | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ROLE_BADGES = {
  SUPER_ADMIN: { label: "SUPER ADMIN", bg: "bg-purple-100 border-purple-200 text-purple-900 font-black animate-pulse", icon: "👑" },
  ADMIN: { label: "MAĞAZA YÖNETİCİSİ", bg: "bg-blue-100 border-blue-200 text-blue-800 font-bold", icon: "🛡️" },
  CUSTOMER_SUPPORT: { label: "MÜŞTERİ DESTEK", bg: "bg-emerald-100 border-emerald-200 text-emerald-800 font-bold", icon: "🎧" },
  CONTENT_MANAGER: { label: "İÇERİK YÖNETİCİSİ", bg: "bg-amber-100 border-amber-200 text-amber-800 font-bold", icon: "📝" },
  ANALYST: { label: "İŞ ANALİSTİ", bg: "bg-teal-100 border-teal-200 text-teal-800 font-bold", icon: "📊" },
};

export default function AdminRoleDetailDrawer({ admin, isOpen, onClose, onSuccess }: AdminRoleDetailDrawerProps) {
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (admin) {
      setSelectedRole(admin.systemRole);
    }
  }, [admin]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !admin) return null;

  const badge = ROLE_BADGES[admin.systemRole] || ROLE_BADGES.ADMIN;

  const handleRoleChange = async () => {
    if (selectedRole === admin.systemRole) return;

    const toastId = toast.loading("Sistem rolü güncelleniyor...");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/roles/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: admin.id,
          newSystemRole: selectedRole,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Sistem rolü ve izinler güncellendi! 🎉", { id: toastId });
        onSuccess();
        onClose();
      } else {
        toast.error(data.error || "Güncelleme başarısız.", { id: toastId });
      }
    } catch (error) {
      toast.error("Sunucu hatası oluştu.", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden text-left">
      {/* OVERLAY */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10 pointer-events-none">
        {/* KAYAR DRAWER PANELİ */}
        <div className="w-screen max-w-md md:max-w-lg bg-white shadow-2xl border-l border-gray-200 pointer-events-auto flex flex-col justify-between rounded-l-3xl animate-in slide-in-from-right duration-300">
          
          {/* DRAWER HEADER */}
          <div className="p-5 sm:p-6 border-b border-gray-100 bg-gray-50/80 flex items-center justify-between rounded-tl-3xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white font-black text-xl flex items-center justify-center shadow-md">
                {badge.icon}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-gray-900 text-base sm:text-lg">{admin.name}</h3>
                  <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full border ${badge.bg}`}>
                    {badge.label}
                  </span>
                </div>
                <p className="text-gray-500 text-xs mt-0.5 font-medium">{admin.email}</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-200/70 hover:bg-gray-300 text-gray-600 flex items-center justify-center font-bold text-xs transition"
            >
              ✕
            </button>
          </div>

          {/* DRAWER İÇERİK */}
          <div className="p-5 sm:p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1 text-xs">
            
            {/* ROL DEĞİŞTİRME SEÇİM KUTUSU */}
            <div className="bg-purple-50/50 p-4 rounded-2xl border border-purple-100 space-y-3">
              <label className="block font-black text-purple-900 text-xs uppercase tracking-wider">
                ⚡ Sistem Rolü Ataması (RBAC Level)
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full p-3 border border-purple-200 rounded-xl bg-white text-gray-900 font-extrabold outline-none focus:ring-2 focus:ring-purple-500 text-xs"
              >
                <option value="SUPER_ADMIN">👑 SUPER ADMIN (Tam Yetki)</option>
                <option value="ADMIN">🛡️ ADMIN (Mağaza Yöneticisi)</option>
                <option value="CUSTOMER_SUPPORT">🎧 CUSTOMER SUPPORT (Müşteri Temsilcisi)</option>
                <option value="CONTENT_MANAGER">📝 CONTENT MANAGER (İçerik Yöneticisi)</option>
                <option value="ANALYST">📊 ANALYST (İş Analisti)</option>
              </select>

              {selectedRole !== admin.systemRole && (
                <button
                  disabled={loading}
                  onClick={handleRoleChange}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-extrabold py-2.5 rounded-xl transition shadow-xs text-xs min-h-[44px]"
                >
                  🚀 Yeni Rolü ve İzinleri Kaydet
                </button>
              )}
            </div>

            {/* ATANMIŞ İZİNLER LİSTESİ */}
            <div className="space-y-3">
              <h4 className="font-extrabold text-gray-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <span>🔑</span> Sahip Olduğu İzinler ({admin.permissions.length})
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {admin.permissions.map((perm) => (
                  <div key={perm} className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-mono text-[11px] font-bold text-gray-800 flex items-center gap-1.5">
                    <span className="text-green-600 font-black">✓</span>
                    <span className="truncate">{perm}</span>
                  </div>
                ))}
              </div>
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
