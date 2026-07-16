"use client";

import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function DeleteCategoryButton({ id }: { id: string }) {
  const router = useRouter();

  const handleDelete = async () => {
    const isConfirmed = window.confirm("Bu kategoriyi silmek istediğinize emin misiniz?");
    if (!isConfirmed) return;

    const toastId = toast.loading("Kategori siliniyor...");

    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Kategori başarıyla silindi! 🗑️", { id: toastId });
        router.refresh(); 
      } else {
        toast.error(data.error || "Silinemedi", { id: toastId });
      }
    } catch (error) {
      toast.error("Silme işlemi sırasında hata oluştu.", { id: toastId });
    }
  };

  return (
    <button 
      onClick={handleDelete}
      // YENİ: p-2 ile tıklama alanını genişlettik, hover:scale ile basıldığını belli ettik
      className="text-gray-400 hover:text-red-600 transition p-2 rounded-full hover:bg-red-50 active:scale-95" 
      title="Kategoriyi Sil"
    >
      🗑️
    </button>
  );
}