// app/admin/brands/BrandForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function BrandForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    const toastId = toast.loading("Marka ekleniyor...");
    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/admin/brands", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || "Marka başarıyla eklendi!", { id: toastId });
        (e.target as HTMLFormElement).reset(); 
        router.refresh(); 
      } else {
        toast.error(data.error || "Bir hata oluştu.", { id: toastId });
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
        <label className="block text-sm font-medium text-gray-700 mb-2">Marka Adı</label>
        <input 
          type="text" 
          name="name" 
          required 
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" 
          placeholder="Örn: Apple, Samsung..."
        />
      </div>

      <button 
        type="submit" 
        disabled={isSubmitting}
        className="w-full bg-gray-900 text-white py-3 rounded-lg font-bold hover:bg-gray-800 transition disabled:bg-gray-400"
      >
        {isSubmitting ? "⏳ Ekleniyor..." : "➕ Markayı Kaydet"}
      </button>
    </form>
  );
}