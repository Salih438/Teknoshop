"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";

export default function EditProductForm({ product, categories, brands }: { product: any, categories: any[], brands: any[] }) {
  const router = useRouter();
  
  const existingImage = product.images?.length > 0 ? product.images[0].imageUrl : "";
  const [imageUrl, setImageUrl] = useState(existingImage);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Yükleniyor bildirimi başlatıyoruz
    const toastId = toast.loading("Ürün güncelleniyor...");
    
    const formData = new FormData(e.currentTarget);
    
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "PUT",
        body: formData,
      });
      
      if (res.ok) {
        toast.success("Ürün başarıyla güncellendi!", { id: toastId });
        router.push("/admin/products");
        router.refresh();
      } else {
        toast.error("Güncelleme başarısız oldu.", { id: toastId });
      }
    } catch (error) {
      console.error("Hata:", error);
      toast.error("Sunucu hatası yaşandı.", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Toast Bildirimlerinin ekranda çıkması için gerekli bileşen */}
      <Toaster position="bottom-right" reverseOrder={false} />

      {/* 1. BÖLÜM: ÜRÜN BİLGİLERİ KARTI */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">📦 Temel Ürün Bilgileri</h2>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ürün Adı</label>
            <input type="text" name="name" defaultValue={product.name} required className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">URL (Slug)</label>
            <input type="text" name="slug" defaultValue={product.slug} required className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition bg-gray-50" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Kategori</label>
            <select name="categoryId" defaultValue={product.categoryId} required className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white transition">
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Marka</label>
            <select name="brandId" defaultValue={product.brandId} required className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white transition">
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>{brand.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fiyat (TL)</label>
            <div className="relative">
              <input type="number" name="price" step="0.01" defaultValue={product.price} required className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" />
              <span className="absolute left-3 top-2.5 text-gray-500 font-medium">₺</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Stok Miktarı</label>
            <input type="number" name="stock" defaultValue={product.stock} required className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" />
          </div>
        </div>
      </div>

      {/* 2. BÖLÜM: ÜRÜN AÇIKLAMASI KARTI */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">📝 Ürün Açıklaması</h2>
        </div>
        <div className="p-6">
          <textarea name="description" rows={5} defaultValue={product.description} required className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition placeholder-gray-400"></textarea>
        </div>
      </div>

      {/* 3. BÖLÜM: GÖRSEL YÖNETİMİ KARTI */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">📷 Görsel Yönetimi</h2>
        </div>
        <div className="p-6 flex flex-col md:flex-row gap-8 items-start">
          <div className="flex-1 w-full space-y-4">
            <label className="block text-sm font-medium text-gray-700">Birincil Görsel URL</label>
            <input 
              type="url" 
              name="imageUrl" 
              required 
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" 
            />
          </div>
          
          <div className="w-full md:w-56 h-56 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center overflow-hidden relative">
            {imageUrl ? (
              <img src={imageUrl} alt="Önizleme" className="max-w-full max-h-full object-contain p-2" />
            ) : (
              <div className="text-center text-gray-400">
                <span className="text-3xl block mb-2">📸</span>
                <span className="text-sm font-medium">Görsel Önizleme</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. BÖLÜM: AKSİYON BUTONLARI */}
      <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
        <button 
          type="button" 
          onClick={() => router.push("/admin/products")}
          className="px-6 py-3 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition"
        >
          İptal Et
        </button>
        <button 
          type="submit" 
          disabled={isSubmitting}
          className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 transition disabled:bg-blue-400 shadow-sm flex items-center gap-2"
        >
          {isSubmitting ? "⏳ Kaydediliyor..." : "💾 Değişiklikleri Kaydet"}
        </button>
      </div>

    </form>
  );
}