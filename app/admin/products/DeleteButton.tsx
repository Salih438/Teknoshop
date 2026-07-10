// app/admin/products/DeleteButton.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteButton({ id }: { id: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    // Yanlışlıkla tıklamalara karşı onay penceresi
    const isConfirmed = window.confirm("Bu ürünü kalıcı olarak silmek istediğinize emin misiniz?");
    
    if (!isConfirmed) return;

    setIsDeleting(true);

    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        // Silme başarılıysa sayfayı yenile (tabloyu güncelle)
        router.refresh();
      } else {
        alert("Ürün silinemedi!");
      }
    } catch (error) {
      console.error("Hata:", error);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <button 
      onClick={handleDelete} 
      disabled={isDeleting}
      className={`transition ${isDeleting ? "text-gray-300 cursor-not-allowed" : "text-gray-400 hover:text-red-600"}`} 
      title="Sil"
    >
      {isDeleting ? "⏳" : "🗑️"}
    </button>
  );
}