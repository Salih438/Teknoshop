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
        (e.target as HTMLFormElement).reset();
        router.refresh();
      } else {
        toast.error("Hata: Bu kategori zaten mevcut olabilir.", { id: toastId });
      }
    } catch {
      toast.error("Sunucu hatası yaşandı.", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-5 sm:p-6 rounded-2xl shadow-xs border border-gray-200 space-y-4 sm:space-y-5">
      <div>
        <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-1.5">Kategori Adı</label>
        <input 
          type="text" 
          name="name" 
          required 
          className="w-full px-3.5 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs sm:text-sm min-h-[44px]" 
          placeholder="Örn: Akıllı Telefonlar"
        />
      </div>

      <div>
        <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-1.5">Açıklama (İsteğe Bağlı)</label>
        <textarea 
          name="description" 
          rows={3} 
          className="w-full px-3.5 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs sm:text-sm resize-none" 
          placeholder="Bu kategorideki ürünler hakkında kısa bilgi..."
        ></textarea>
      </div>

      <button 
        type="submit" 
        disabled={isSubmitting}
        className="w-full bg-gray-900 text-white py-3 rounded-xl font-extrabold hover:bg-gray-800 transition disabled:bg-gray-400 text-xs sm:text-sm min-h-[44px]"
      >
        {isSubmitting ? "⏳ Ekleniyor..." : "➕ Kategoriyi Kaydet"}
      </button>
    </form>
  );
}