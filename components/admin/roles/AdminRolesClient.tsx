"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AdminRoleDetailDrawer, { AdminRoleDetailDrawerData } from "./AdminRoleDetailDrawer";

export interface AdminUserRoleDTO {
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

interface AdminRolesClientProps {
  admins: AdminUserRoleDTO[];
  matrix: {
    permission: string;
    SUPER_ADMIN: boolean;
    ADMIN: boolean;
    CUSTOMER_SUPPORT: boolean;
    CONTENT_MANAGER: boolean;
    ANALYST: boolean;
  }[];
}

const ROLE_BADGES = {
  SUPER_ADMIN: { label: "SUPER ADMIN", bg: "bg-purple-100 border-purple-200 text-purple-900 font-black", icon: "👑" },
  ADMIN: { label: "ADMIN", bg: "bg-blue-100 border-blue-200 text-blue-800 font-bold", icon: "🛡️" },
  CUSTOMER_SUPPORT: { label: "DESTEK", bg: "bg-emerald-100 border-emerald-200 text-emerald-800 font-bold", icon: "🎧" },
  CONTENT_MANAGER: { label: "İÇERİK", bg: "bg-amber-100 border-amber-200 text-amber-800 font-bold", icon: "📝" },
  ANALYST: { label: "ANALİST", bg: "bg-teal-100 border-teal-200 text-teal-800 font-bold", icon: "📊" },
};

export default function AdminRolesClient({ admins, matrix }: AdminRolesClientProps) {
  const router = useRouter();

  const [selectedDrawerAdmin, setSelectedDrawerAdmin] = useState<AdminRoleDetailDrawerData | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"matrix" | "admins">("matrix");

  const openDrawer = (admin: AdminUserRoleDTO) => {
    setSelectedDrawerAdmin(admin);
    setIsDrawerOpen(true);
  };

  return (
    <div className="space-y-6 w-full overflow-x-clip animate-in fade-in duration-300">
      
      {/* 🚀 BAŞLIK */}
      <div className="border-b border-gray-200 pb-5">
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
          <span>🔐</span> Rol Bazlı Erişim Kontrolü (RBAC & İzin Matrisi)
        </h1>
        <p className="text-gray-500 text-xs sm:text-sm mt-0.5 font-medium">
          Shopify Plus, Stripe Dashboard ve AWS IAM standartlarında yönetici rolleri ve erişim izinleri matrisi.
        </p>
      </div>

      {/* 🚀 SEKMELER (MATRIX VS ADMIN LIST) */}
      <div className="bg-white p-1.5 rounded-2xl border border-gray-200 shadow-xs flex space-x-1 max-w-md">
        <button
          onClick={() => setActiveTab("matrix")}
          className={`flex-1 py-2 rounded-xl font-extrabold text-xs transition ${
            activeTab === "matrix" ? "bg-gray-900 text-white shadow-xs" : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          🔑 İzin Matrisi (Permission Matrix)
        </button>
        <button
          onClick={() => setActiveTab("admins")}
          className={`flex-1 py-2 rounded-xl font-extrabold text-xs transition ${
            activeTab === "admins" ? "bg-gray-900 text-white shadow-xs" : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          👥 Admin Kullanıcılar ({admins.length})
        </button>
      </div>

      {/* 🚀 TAB 1: PERMISSION MATRIX TABLOSU */}
      {activeTab === "matrix" && (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <h3 className="font-black text-gray-900 text-sm">Rol İzin Matrisi (Role-Permission Mapping)</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-gray-50 text-gray-500 font-extrabold uppercase tracking-wider text-[10px] border-b border-gray-200">
                <tr>
                  <th className="p-3.5">İzin Adı (Permission Name)</th>
                  <th className="p-3.5 text-center">👑 Super Admin</th>
                  <th className="p-3.5 text-center">🛡️ Admin</th>
                  <th className="p-3.5 text-center">🎧 Customer Support</th>
                  <th className="p-3.5 text-center">📝 Content Manager</th>
                  <th className="p-3.5 text-center">📊 Analyst</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {matrix.map((row) => (
                  <tr key={row.permission} className="hover:bg-gray-50 transition">
                    <td className="p-3.5 font-mono font-bold text-gray-900 text-xs">
                      {row.permission}
                    </td>

                    {(["SUPER_ADMIN", "ADMIN", "CUSTOMER_SUPPORT", "CONTENT_MANAGER", "ANALYST"] as const).map((roleKey) => {
                      const hasIt = row[roleKey];
                      return (
                        <td key={roleKey} className="p-3.5 text-center font-bold">
                          {hasIt ? (
                            <span className="w-6 h-6 rounded-full bg-green-100 text-green-700 font-black flex items-center justify-center mx-auto text-xs">
                              ✓
                            </span>
                          ) : (
                            <span className="text-gray-300 font-normal">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 🚀 TAB 2: ADMİN KULLANICILAR LİSTESİ */}
      {activeTab === "admins" && (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <h3 className="font-black text-gray-900 text-sm">Yönetici Hesapları ve Sistem Rolleri</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-gray-50 text-gray-500 font-extrabold uppercase tracking-wider text-[10px] border-b border-gray-200">
                <tr>
                  <th className="p-3.5">Admin Ad Soyad</th>
                  <th className="p-3.5">E-Posta</th>
                  <th className="p-3.5">Sistem Rolü</th>
                  <th className="p-3.5">İzin Adedi</th>
                  <th className="p-3.5 text-center">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {admins.map((adm) => {
                  const badge = ROLE_BADGES[adm.systemRole] || ROLE_BADGES.ADMIN;

                  return (
                    <tr key={adm.id} className="hover:bg-gray-50 transition">
                      <td className="p-3.5 font-extrabold text-gray-900">{adm.name}</td>
                      <td className="p-3.5 text-gray-600 font-mono text-xs">{adm.email}</td>
                      <td className="p-3.5">
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${badge.bg}`}>
                          {badge.icon} {badge.label}
                        </span>
                      </td>
                      <td className="p-3.5 font-bold text-purple-600">
                        {adm.permissions.length} Yetki
                      </td>
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => openDrawer(adm)}
                          className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-extrabold rounded-xl transition text-xs min-h-[36px]"
                        >
                          👁 Detay & Rol Değiştir
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 🚀 ADMIN ROLE DETAIL DRAWER */}
      <AdminRoleDetailDrawer
        admin={selectedDrawerAdmin}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSuccess={() => router.refresh()}
      />

    </div>
  );
}
