"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import ConfirmModal from "@/components/ui/ConfirmModal";

export default function DeleteBrandButton({ id }: { id: string }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    const toastId = toast.loading("Marka siliniyor...");

    try {
      const res = await fetch(`/api/admin/brands/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Marka başarıyla silindi! 🗑️", { id: toastId });
        router.refresh(); 
      } else {
        toast.error(data.error || "Silinemedi", { id: toastId });
      }
    } catch (error) {
      toast.error("Silme işlemi sırasında hata oluştu.", { id: toastId });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        disabled={isDeleting}
        className="text-gray-400 hover:text-red-600 transition cursor-pointer disabled:opacity-50" 
        title="Sil"
      >
        🗑️
      </button>

      <ConfirmModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onConfirm={handleDelete}
        title="Markayı Sil"
        description="Bu markayı silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
        confirmText="Evet, Sil"
        cancelText="Vazgeç"
        variant="danger"
        isLoading={isDeleting}
      />
    </>
  );
}