"use client";

import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function DeleteBrandButton({ id }: { id: string }) {
  const router = useRouter();

  const handleDelete = async () => {
    const isConfirmed = window.confirm("Bu markayı silmek istediğinize emin misiniz?");
    if (!isConfirmed) return;

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
        toast.error(data.error, { id: toastId });
      }
    } catch (error) {
      toast.error("Silme işlemi sırasında hata oluştu.", { id: toastId });
    }
  };

  return (
    <button 
      onClick={handleDelete}
      className="text-gray-400 hover:text-red-600 transition" 
      title="Sil"
    >
      🗑️
    </button>
  );
}