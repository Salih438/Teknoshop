// app/admin/users/UserActionButtons.tsx
"use client";

import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function UserActionButtons({ 
  userId, 
  currentRole, 
  isActive 
}: { 
  userId: string, 
  currentRole: string, 
  isActive: boolean 
}) {
  const router = useRouter();

  // ROL DEĞİŞTİRME (USER <-> ADMIN)
  async function toggleRole() {
    const newRole = currentRole === "ADMIN" ? "USER" : "ADMIN";
    if (!confirm(`Kullanıcının yetkisini ${newRole} olarak değiştirmek istiyor musunuz?`)) return;

    const toastId = toast.loading("Yetki güncelleniyor...");
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (res.ok) {
        toast.success("Kullanıcı yetkisi değiştirildi!", { id: toastId });
        router.refresh(); // Sayfayı yenile ve yeni durumu göster
      } else {
        toast.error("Güncelleme başarısız.", { id: toastId });
      }
    } catch (error) {
      toast.error("Sunucu hatası.", { id: toastId });
    }
  }

  // DEVRE DIŞI BIRAKMA VEYA AKTİF ETME (SOFT DELETE)
  async function toggleActive() {
    const actionText = isActive ? "Devre Dışı Bırakmak" : "Aktifleştirmek";
    if (!confirm(`Bu kullanıcıyı ${actionText} istediğinize emin misiniz?`)) return;

    const toastId = toast.loading("Durum güncelleniyor...");
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (res.ok) {
        toast.success(isActive ? "Kullanıcı engellendi." : "Kullanıcı aktifleştirildi.", { id: toastId });
        router.refresh();
      } else {
        toast.error("Güncelleme başarısız.", { id: toastId });
      }
    } catch (error) {
      toast.error("Sunucu hatası.", { id: toastId });
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button 
        onClick={toggleRole}
        className="text-gray-400 hover:text-orange-600 transition" 
        title={currentRole === "ADMIN" ? "Normal Kullanıcı Yap" : "Yönetici (Admin) Yap"}
      >
        ✏️
      </button>
      <button 
        onClick={toggleActive}
        className={`transition font-medium ${isActive ? 'text-gray-400 hover:text-red-600' : 'text-red-500 hover:text-green-600'}`} 
        title={isActive ? "Devre Dışı Bırak (Soft Delete)" : "Kilidi Aç (Aktifleştir)"}
      >
        {isActive ? "🚫" : "✅"}
      </button>
    </div>
  );
}