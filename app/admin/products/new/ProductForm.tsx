"use client";
import Image from "next/image";


import { useState } from "react";
import { useRouter } from "next/navigation";
import { UploadButton } from "@/lib/utils/uploadthing"; 
import toast from "react-hot-toast";

// Varyasyon tipimizi tanımlıyoruz
interface VariantInfo {
  id: number;
  color: string;
  storage: string;
  price: string;
  stock: string;
}

export default function ProductForm({ categories, brands }: { categories: { id: string; name: string }[], brands: { id: string; name: string }[] }) {
  const router = useRouter();
  const [imageUrl, setImageUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageMode, setImageMode] = useState<"upload" | "url">("upload");

  // 🚀 YENİ: Varyasyon State'leri
  const [hasVariants, setHasVariants] = useState(false);
  const [variants, setVariants] = useState<VariantInfo[]>([]);

  // Yeni varyasyon satırı ekleme fonksiyonu
  const addVariant = () => {
    setVariants([...variants, { id: Date.now(), color: "", storage: "", price: "", stock: "0" }]);
  };

  // Varyasyon satırını silme fonksiyonu
  const removeVariant = (id: number) => {
    setVariants(variants.filter((v) => v.id !== id));
  };

  // Varyasyon inputlarındaki değişiklikleri yakalama
  const updateVariant = (id: number, field: keyof VariantInfo, value: string) => {
    setVariants(variants.map((v) => (v.id === id ? { ...v, [field]: value } : v)));
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    
    if (!imageUrl) {
      toast.error("Lütfen önce bir ürün fotoğrafı ekleyin.");
      return;
    }

    if (hasVariants && variants.length === 0) {
      toast.error("Varyasyon seçeneğini aktif ettiniz ancak varyasyon eklemediniz.");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Ürün veritabanına kaydediliyor...");
    
    const formData = new FormData(e.currentTarget);
    const isActive = e.currentTarget.isActive.checked;
    formData.set("isActive", isActive.toString());
    formData.set("imageUrl", imageUrl);
    
    // 🚀 YENİ: Varyasyonları JSON string olarak API'ye gönderiyoruz
    if (hasVariants && variants.length > 0) {
      formData.set("variants", JSON.stringify(variants));
    }
    
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
          <label className="block text-sm font-medium text-gray-700 mb-2">Ana Fiyat (TL)</label>
          <input type="number" name="price" step="0.01" required className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="4500" />
        </div>

        {/* Stok */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Ana Stok Miktarı</label>
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

      {/* 🚀 YENİ: VARYASYON YÖNETİM MODÜLÜ */}
      <div className="border border-blue-200 rounded-xl p-6 bg-blue-50/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <label className="block text-base font-bold text-gray-900">🎨 Ürün Varyasyonları</label>
            <p className="text-xs text-gray-500 mt-1">Renk, Hafıza veya Beden gibi seçenekler ekleyin.</p>
          </div>
          
          {/* Toggle Switch */}
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" checked={hasVariants} onChange={(e) => {
              setHasVariants(e.target.checked);
              if (e.target.checked && variants.length === 0) addVariant();
            }} />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            <span className="ml-3 text-sm font-bold text-gray-700">Seçenekleri Aç</span>
          </label>
        </div>

        {hasVariants && (
          <div className="mt-6 space-y-4">
            {variants.map((variant) => (
              <div key={variant.id} className="flex flex-wrap md:flex-nowrap items-start gap-4 p-4 bg-white border border-gray-200 rounded-xl shadow-sm relative animate-in fade-in slide-in-from-top-2">
                
                <div className="flex-1 min-w-[120px]">
                  <label className="block text-xs font-bold text-gray-500 mb-1">Renk Seçeneği</label>
                  <input type="text" value={variant.color} onChange={(e) => updateVariant(variant.id, "color", e.target.value)} placeholder="Siyah, Kırmızı vs." className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 focus:bg-white" />
                </div>
                
                <div className="flex-1 min-w-[120px]">
                  <label className="block text-xs font-bold text-gray-500 mb-1">Hafıza / Beden</label>
                  <input type="text" value={variant.storage} onChange={(e) => updateVariant(variant.id, "storage", e.target.value)} placeholder="128GB, XL vs." className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 focus:bg-white" />
                </div>
                
                <div className="flex-1 min-w-[120px]">
                  <label className="block text-xs font-bold text-gray-500 mb-1">Özel Fiyat (₺)</label>
                  <input type="number" step="0.01" value={variant.price} onChange={(e) => updateVariant(variant.id, "price", e.target.value)} placeholder="Boşsa ana fiyat" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 focus:bg-white" />
                </div>
                
                <div className="w-24 min-w-[80px]">
                  <label className="block text-xs font-bold text-gray-500 mb-1">Stok</label>
                  <input type="number" required={hasVariants} value={variant.stock} onChange={(e) => updateVariant(variant.id, "stock", e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 focus:bg-white" />
                </div>

                <button type="button" onClick={() => removeVariant(variant.id)} className="mt-6 p-2 text-red-500 hover:bg-red-50 rounded-lg transition" title="Bu seçeneği sil">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            ))}

            <button type="button" onClick={addVariant} className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-800 transition px-2 py-1">
              <span>+</span> Yeni Seçenek Ekle
            </button>
          </div>
        )}
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
          <div className="flex-1 w-full bg-white border border-gray-200 p-6 rounded-xl flex flex-col items-center justify-center min-h-[160px]">
            {imageMode === "upload" ? (
              imageUrl && !imageUrl.startsWith("https://utfs.io") && imageUrl !== "" ? (
                 <div className="text-center w-full">
                  <p className="text-sm text-amber-600 mb-3">Şu an bir dış URL kullanıyorsunuz. Buluta resim yüklemek için mevcut URL&apos;i temizleyin.</p>
                  <button type="button" onClick={() => setImageUrl("")} className="px-4 py-2 bg-amber-100 text-amber-700 rounded-lg text-sm font-bold hover:bg-amber-200 transition">URL&apos;i Temizle</button>
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
          
          <div className="w-full md:w-64 h-48 bg-white border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center overflow-hidden relative">
            {imageUrl ? (
              <>
                <Image src={imageUrl} alt="Önizleme" className="max-w-full max-h-full object-contain" width={500} height={500} />
                <button type="button" onClick={() => setImageUrl("")} className="absolute top-2 right-2 bg-white/90 text-red-500 w-8 h-8 rounded-full flex items-center justify-center shadow-sm hover:bg-red-50 transition" title="Görseli Kaldır">✕</button>
              </>
            ) : (
              <span className="text-gray-400 text-sm font-medium">Resim Önizleme</span>
            )}
          </div>
        </div>
      </div>

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