"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UploadButton } from "@/lib/utils/uploadthing"; 
import toast from "react-hot-toast";

export default function ProductForm({ categories, brands }: { categories: any[], brands: any[] }) {
  const router = useRouter();
  const [imageUrl, setImageUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // YENİ: Resim ekleme yöntemini tutan state (upload veya url)
  const [imageMode, setImageMode] = useState<"upload" | "url">("upload");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    
    if (!imageUrl) {
      toast.error("Lütfen önce bir ürün fotoğrafı ekleyin.");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Ürün veritabanına kaydediliyor...");
    
    const formData = new FormData(e.currentTarget);
    const isActive = e.currentTarget.isActive.checked;
    formData.set("isActive", isActive.toString());
    
    formData.set("imageUrl", imageUrl);
    
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        body: formData,
      });
      
      if (res.ok) {
        toast.success("Ürün başarıyla eklendi! 🎉", { id: toastId });
        router.push("/admin/products");
        router.refresh();
      } else {
        const errorData = await res.json();
        toast.error(`Kayıt başarısız: ${errorData.error}`, { id: toastId });
      }
    } catch (error) {
      console.error("Hata:", error);
      toast.error("Sunucuya bağlanılamadı.", { id: toastId });
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
          <input type="text" name="name" required className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Örn: Hak5 LAN Turtle" />
        </div>

        {/* Slug */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">URL (Slug)</label>
          <input type="text" name="slug" required className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="orn-hak5-lan-turtle" />
        </div>

        {/* Kategori Seçimi */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Kategori ▼</label>
          <select name="categoryId" required className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
            <option value="">Kategori Seçin</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        {/* Marka Seçimi */}
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
          <input type="number" name="price" step="0.01" required className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="4500" />
        </div>

        {/* Stok */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Stok Miktarı</label>
          <input type="number" name="stock" required className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="15" />
        </div>

        {/* SKU */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Stok Kodu (SKU)</label>
          <input type="text" name="sku" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Örn: HAK5-LAN-TRTL" />
          <p className="text-xs text-gray-400 mt-1">İsteğe bağlı. Benzersiz olmalıdır.</p>
        </div>

        {/* Durum */}
        <div className="flex items-center mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <input 
            type="checkbox" 
            name="isActive" 
            id="isActive" 
            defaultChecked 
            className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer" 
          />
          <label htmlFor="isActive" className="ml-3 text-sm font-bold text-gray-800 cursor-pointer">
            Ürünü Vitrinde Yayınla (Aktif)
          </label>
        </div>
      </div>

      {/* Açıklama */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Ürün Özellikleri / Açıklama</label>
        <textarea name="description" rows={4} required className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ürün detaylarını buraya girin..."></textarea>
      </div>

      {/* ESNEK GÖRSEL YÖNETİMİ (SEKMELİ YAPI) */}
      <div className="border border-gray-200 rounded-xl p-6 bg-gray-50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
          <label className="block text-sm font-bold text-gray-800">📷 Görsel Yönetimi</label>
          
          {/* Sekme Butonları */}
          <div className="flex bg-gray-200 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setImageMode("upload")}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition ${imageMode === "upload" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              ☁️ Buluttan Yükle
            </button>
            <button
              type="button"
              onClick={() => setImageMode("url")}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition ${imageMode === "url" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              🔗 URL İle Ekle
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* Sol Taraf: Giriş Alanı */}
          <div className="flex-1 w-full bg-white border border-gray-200 p-6 rounded-xl flex flex-col items-center justify-center min-h-[160px]">
            {imageMode === "upload" ? (
              // UploadThing Modu
              imageUrl && !imageUrl.startsWith("https://utfs.io") && imageUrl !== "" ? (
                 <div className="text-center w-full">
                  <p className="text-sm text-amber-600 mb-3">Şu an bir dış URL kullanıyorsunuz. Buluta resim yüklemek için mevcut URL'i temizleyin.</p>
                  <button type="button" onClick={() => setImageUrl("")} className="px-4 py-2 bg-amber-100 text-amber-700 rounded-lg text-sm font-bold hover:bg-amber-200 transition">URL'i Temizle</button>
                 </div>
              ) : imageUrl ? (
                <div className="text-center">
                  <span className="text-green-600 font-bold text-lg mb-2 block">✅ Yüklendi!</span>
                  <button type="button" onClick={() => setImageUrl("")} className="text-sm text-red-500 hover:underline">Başka fotoğraf seç</button>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-500 mb-4 text-center">Ürününüz için bilgisayarınızdan bir fotoğraf seçin.</p>
                  <UploadButton
                    endpoint="productImageUploader"
                    onClientUploadComplete={(res) => {
                      if (res && res.length > 0) {
                        setImageUrl(res[0].url);
                        toast.success("Fotoğraf buluta başarıyla yüklendi! ☁️");
                      }
                    }}
                    onUploadError={(error: Error) => {
                      toast.error(`Yükleme hatası: ${error.message}`);
                    }}
                    appearance={{
                      button: "bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2 rounded-lg transition"
                    }}
                  />
                </>
              )
            ) : (
              // URL Modu
              <div className="w-full flex flex-col items-start">
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Resim Linki (URL)</label>
                <input 
                  type="url" 
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                  placeholder="https://images.unsplash.com/photo-..." 
                />
                <p className="text-[11px] text-gray-400 mt-2">Dışarıdan alınan linklerin ileride kırılabileceğini (silinebileceğini) unutmayın.</p>
              </div>
            )}
          </div>
          
          {/* Sağ Taraf: Önizleme Kutusu */}
          <div className="w-full md:w-64 h-48 bg-white border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center overflow-hidden relative">
            {imageUrl ? (
              <>
                <img src={imageUrl} alt="Önizleme" className="max-w-full max-h-full object-contain" />
                <button type="button" onClick={() => setImageUrl("")} className="absolute top-2 right-2 bg-white/90 text-red-500 w-8 h-8 rounded-full flex items-center justify-center shadow-sm hover:bg-red-50 transition" title="Görseli Kaldır">✕</button>
              </>
            ) : (
              <span className="text-gray-400 text-sm font-medium">Resim Önizleme</span>
            )}
          </div>
        </div>
      </div>

      {/* Kaydet Butonu */}
      <button 
        type="submit" 
        disabled={isSubmitting || !imageUrl}
        className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold hover:bg-gray-800 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "Kaydediliyor..." : (!imageUrl ? "Önce Fotoğraf Ekleyin" : "Ürünü Veritabanına Kaydet 🚀")}
      </button>

    </form>
  );
}