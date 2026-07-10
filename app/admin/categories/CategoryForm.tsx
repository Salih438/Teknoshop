// app/admin/categories/CategoryForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function CategoryForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    const toastId = toast.loading("Kategori ekleniyor...");
    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        toast.success("Kategori başarıyla eklendi!", { id: toastId });
        (e.target as HTMLFormElement).reset(); // Formu temizle
        router.refresh(); // Sağ taraftaki tabloyu güncelle
      } else {
        toast.error("Hata: Bu kategori zaten mevcut olabilir.", { id: toastId });
      }
    } catch (error) {
      toast.error("Sunucu hatası yaşandı.", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Kategori Adı</label>
        <input 
          type="text" 
          name="name" 
          required 
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" 
          placeholder="Örn: Akıllı Telefonlar"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Açıklama (İsteğe Bağlı)</label>
        <textarea 
          name="description" 
          rows={3} 
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" 
          placeholder="Bu kategorideki ürünler hakkında kısa bilgi..."
        ></textarea>
      </div>

      <button 
        type="submit" 
        disabled={isSubmitting}
        className="w-full bg-gray-900 text-white py-3 rounded-lg font-bold hover:bg-gray-800 transition disabled:bg-gray-400"
      >
        {isSubmitting ? "⏳ Ekleniyor..." : "➕ Kategoriyi Kaydet"}
      </button>
    </form>
  );
}