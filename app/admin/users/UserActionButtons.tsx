// app/admin/users/UserActionButtons.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import ConfirmModal from "@/components/ui/ConfirmModal";

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

  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isActiveModalOpen, setIsActiveModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const targetRole = currentRole === "ADMIN" ? "USER" : "ADMIN";
  const actionText = isActive ? "Devre Dışı Bırakmak" : "Aktifleştirmek";

  // ROL DEĞİŞTİRME (USER <-> ADMIN)
  async function handleToggleRole() {
    setIsSubmitting(true);
    const toastId = toast.loading("Yetki güncelleniyor...");
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: targetRole }),
      });

      if (res.ok) {
        toast.success("Kullanıcı yetkisi değiştirildi!", { id: toastId });
        router.refresh();
      } else {
        toast.error("Güncelleme başarısız.", { id: toastId });
      }
    } catch (error) {
      toast.error("Sunucu hatası.", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  }

  // DEVRE DIŞI BIRAKMA VEYA AKTİF ETME (SOFT DELETE)
  async function handleToggleActive() {
    setIsSubmitting(true);
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
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <div className="flex items-center gap-3">
        <button 
          onClick={() => setIsRoleModalOpen(true)}
          disabled={isSubmitting}
          className="text-gray-400 hover:text-orange-600 transition cursor-pointer disabled:opacity-50" 
          title={currentRole === "ADMIN" ? "Normal Kullanıcı Yap" : "Yönetici (Admin) Yap"}
        >
          ✏️
        </button>
        <button 
          onClick={() => setIsActiveModalOpen(true)}
          disabled={isSubmitting}
          className={`transition font-medium cursor-pointer disabled:opacity-50 ${isActive ? 'text-gray-400 hover:text-red-600' : 'text-red-500 hover:text-green-600'}`} 
          title={isActive ? "Devre Dışı Bırak (Soft Delete)" : "Kilidi Aç (Aktifleştir)"}
        >
          {isActive ? "🚫" : "✅"}
        </button>
      </div>

      {/* Yetki Değiştirme Modalı */}
      <ConfirmModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        onConfirm={handleToggleRole}
        title="Kullanıcı Yetkisi Değiştir"
        description={`Kullanıcının yetkisini ${targetRole} olarak değiştirmek istediğinize emin misiniz?`}
        confirmText="Evet, Değiştir"
        cancelText="Vazgeç"
        variant="warning"
        isLoading={isSubmitting}
      />

      {/* Aktiflik Durumu Değiştirme Modalı */}
      <ConfirmModal
        isOpen={isActiveModalOpen}
        onClose={() => setIsActiveModalOpen(false)}
        onConfirm={handleToggleActive}
        title={isActive ? "Kullanıcıyı Engelle" : "Kullanıcıyı Aktifleştir"}
        description={`Bu kullanıcıyı ${actionText} istediğinize emin misiniz?`}
        confirmText={isActive ? "Evet, Engelle" : "Evet, Aktifleştir"}
        cancelText="Vazgeç"
        variant={isActive ? "danger" : "primary"}
        isLoading={isSubmitting}
      />
    </>
  );
}