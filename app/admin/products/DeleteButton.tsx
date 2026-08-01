// app/admin/products/DeleteButton.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import ConfirmModal from "@/components/ui/ConfirmModal";

export default function DeleteButton({ id }: { id: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Ürün kalıcı olarak silindi.");
        router.refresh();
      } else {
        toast.error("Ürün silinemedi!");
      }
    } catch (error) {
      console.error("Hata:", error);
      toast.error("Silme işlemi sırasında sunucu hatası oluştu.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)} 
        disabled={isDeleting}
        className={`transition ${isDeleting ? "text-gray-300 cursor-not-allowed" : "text-gray-400 hover:text-red-600"}`} 
        title="Sil"
      >
        {isDeleting ? "⏳" : "🗑️"}
      </button>

      <ConfirmModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onConfirm={handleDelete}
        title="Ürünü Sil"
        description="Bu ürünü kalıcı olarak silmek istediğinize emin misiniz? Bu işlem veritabanından kalıcı olarak kaldıracaktır."
        confirmText="Evet, Sil"
        cancelText="Vazgeç"
        variant="danger"
        isLoading={isDeleting}
      />
    </>
  );
}