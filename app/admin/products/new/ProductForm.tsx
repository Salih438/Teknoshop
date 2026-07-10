"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ProductForm({ categories, brands }: { categories: any[], brands: any[] }) {
  const router = useRouter();
  const [imageUrl, setImageUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form gönderildiğinde çalışacak fonksiyon (Listendeki 24. Madde: Loading State)
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        body: formData,
      });
      
      if (res.ok) {
        router.push("/admin/products");
        router.refresh();
      }
    } catch (error) {
      console.error("Hata:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-xl shadow-sm border border-gray-100">
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Ürün Adı */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Ürün Adı</label>
          <input type="text" name="name" required className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Örn: Apple iPhone 16e" />
        </div>

        {/* Slug */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">URL (Slug)</label>
          <input type="text" name="slug" required className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="orn-apple-iphone-16e" />
        </div>

        {/* Kategori Seçimi (Listendeki 7. Madde) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Kategori ▼</label>
          <select name="categoryId" required className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
            <option value="">Kategori Seçin</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        {/* Marka Seçimi (Listendeki 8. Madde) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Marka ▼</label>
          <select name="brandId" required className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
            <option value="">Marka Seçin</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>{brand.name}</option>
            ))}
          </select>
        </div>

        {/* Fiyat */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Fiyat (TL)</label>
          <input type="number" name="price" step="0.01" required className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="75000" />
        </div>

        {/* Stok (Listendeki 6. Madde) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Stok Miktarı</label>
          <input type="number" name="stock" required className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="150" />
        </div>
      </div>

      {/* Açıklama */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Ürün Özellikleri / Açıklama</label>
        <textarea name="description" rows={4} required className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="• M4 İşlemci&#10;• 16GB RAM..."></textarea>
      </div>

      {/* Görsel Önizleme Alanı (Listendeki 5. Madde) */}
      <div className="border border-gray-200 rounded-xl p-6 bg-gray-50">
        <label className="block text-sm font-bold text-gray-800 mb-2">📷 Görsel Yönetimi</label>
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="flex-1 w-full">
            <input 
              type="url" 
              name="imageUrl" 
              required 
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
              placeholder="https://... resim linkini yapıştırın" 
            />
            <p className="text-xs text-gray-500 mt-2">Şimdilik tek link alıyoruz, ileride çoklu yüklemeye (Upload) çevireceğiz.</p>
          </div>
          
          {/* Önizleme Kutusu */}
          <div className="w-full md:w-48 h-48 bg-white border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center overflow-hidden">
            {imageUrl ? (
              <img src={imageUrl} alt="Önizleme" className="max-w-full max-h-full object-contain" />
            ) : (
              <span className="text-gray-400 text-sm font-medium">Resim Önizleme</span>
            )}
          </div>
        </div>
      </div>

      {/* Kaydet Butonu */}
      <button 
        type="submit" 
        disabled={isSubmitting}
        className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold hover:bg-gray-800 transition disabled:bg-gray-400"
      >
        {isSubmitting ? "Kaydediliyor..." : "Ürünü Veritabanına Kaydet 🚀"}
      </button>

    </form>
  );
}