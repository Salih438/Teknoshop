"use client";
import Image from "next/image";


import { useState } from "react";
import { useRouter } from "next/navigation";
import { UploadButton } from "@/lib/utils/uploadthing"; 
import toast from "react-hot-toast";
import DynamicVariantBuilder from "@/components/admin/variants/DynamicVariantBuilder";


export default function ProductForm({ categories, brands }: { categories: { id: string; name: string }[], brands: { id: string; name: string }[] }) {
  const router = useRouter();
  const [imageUrl, setImageUrl] = useState("");
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageMode, setImageMode] = useState<"upload" | "url">("upload");
  const [galleryImageMode, setGalleryImageMode] = useState<"upload" | "url">("upload");
  const [galleryUrlInput, setGalleryUrlInput] = useState("");

  const [resetSignal, setResetSignal] = useState(0);
  const [dynamicVariants, setDynamicVariants] = useState<any[]>([]);

  const [priceInput, setPriceInput] = useState<string>("");
  const [comparePriceInput, setComparePriceInput] = useState<string>("");

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
    
    // 🚀 YENİ: Varyasyonları JSON string olarak API'ye gönderiyoruz
    if (dynamicVariants.length > 0) {
      // API tarafında parse edilebilmesi için sayısal verilerin formata uygun olduğundan emin oluyoruz
      const formattedVariants = dynamicVariants.map(v => ({
        ...v,
        price: v.price ? parseFloat(v.price) : null,
        discountedPrice: v.discountedPrice ? parseFloat(v.discountedPrice) : null,
        stock: parseInt(v.stock, 10) || 0,
      }));
      formData.set("variants", JSON.stringify(formattedVariants));
    }
    
    // 🚀 YENİ: Galeri görsellerini JSON olarak API'ye gönderiyoruz
    if (galleryImages.length > 0) {
      formData.set("galleryImages", JSON.stringify(galleryImages));
    }
    
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        body: formData,
      });
      
      if (res.ok) {
        toast.success("Ürün başarıyla eklendi! 🎉", { id: toastId });
        setResetSignal(prev => prev + 1);
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
          <label className="block text-sm font-medium text-gray-700 mb-2">Ana Fiyat (Satış Fiyatı - TL)</label>
          <input 
            type="number" 
            name="price" 
            step="0.01" 
            required 
            value={priceInput}
            onChange={(e) => setPriceInput(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
            placeholder="4500" 
          />
        </div>

        {/* İndirim Öncesi Fiyat */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">İndirim Öncesi Fiyat (Opsiyonel - TL)</label>
          <input 
            type="number" 
            name="comparePrice" 
            step="0.01" 
            value={comparePriceInput}
            onChange={(e) => setComparePriceInput(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
            placeholder="5500" 
          />
          {comparePriceInput && parseFloat(comparePriceInput) <= parseFloat(priceInput || "0") && (
            <p className="text-xs text-amber-600 font-medium mt-1">
              ⚠️ İndirim öncesi fiyat satış fiyatından yüksek olmalıdır.
            </p>
          )}
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

      {/* 🚀 FAZ 13.2.1: DİNAMİK VARYASYON YÖNETİCİSİ */}
      <DynamicVariantBuilder 
        resetSignal={resetSignal} 
        onVariantsChange={setDynamicVariants}
      />



      {/* Açıklama */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Ürün Özellikleri / Açıklama</label>
        <textarea name="description" rows={4} required className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ürün detaylarını buraya girin..."></textarea>
      </div>

      {/* ESNEK GÖRSEL YÖNETİMİ (SEKMELİ YAPI) */}
      <div className="space-y-6">
        {/* ANA KAPAK GÖRSELİ */}
        <div className="border border-gray-200 rounded-xl p-6 bg-gray-50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
            <label className="block text-sm font-bold text-gray-800">📷 Kapak Görseli (Ana Resim)</label>
            
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
                    <p className="text-sm text-gray-500 mb-4 text-center">Vitrinde görünecek ana kapağı seçin.</p>
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
                  <p className="text-[11px] text-gray-400 mt-2">Dışarıdan alınan linklerin ileride kırılabileceğini unutmayın.</p>
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
                <span className="text-gray-400 text-sm font-medium">Kapak Önizleme</span>
              )}
            </div>
          </div>
        </div>

        {/* GALERİ GÖRSELLERİ */}
        <div className="border border-gray-200 rounded-xl p-6 bg-gray-50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
            <label className="block text-sm font-bold text-gray-800">📸 Ürün Galerisi (Ek Görseller)</label>
            
            <div className="flex bg-gray-200 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setGalleryImageMode("upload")}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition ${galleryImageMode === "upload" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                ☁️ Çoklu Yükle
              </button>
              <button
                type="button"
                onClick={() => setGalleryImageMode("url")}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition ${galleryImageMode === "url" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                🔗 URL Ekle
              </button>
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-6 rounded-xl flex flex-col items-center justify-center min-h-[120px] mb-6">
            {galleryImageMode === "upload" ? (
              <>
                <p className="text-sm text-gray-500 mb-4 text-center">Ürününüz için ek fotoğraflar seçin. (Aynı anda birden fazla seçebilirsiniz)</p>
                <UploadButton
                  endpoint="productImageUploader"
                  onClientUploadComplete={(res) => {
                    if (res && res.length > 0) {
                      const newUrls = res.map(file => file.url);
                      setGalleryImages(prev => [...prev, ...newUrls]);
                      toast.success(`${res.length} görsel galeriye eklendi! 🎉`);
                    }
                  }}
                  onUploadError={(error: Error) => {
                    toast.error(`Yükleme hatası: ${error.message}`);
                  }}
                  appearance={{
                    button: "bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2 rounded-lg transition",
                    allowedContent: "hidden"
                  }}
                />
              </>
            ) : (
              <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-end gap-3 sm:gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Galeri İçin Resim Linki (URL)</label>
                  <input 
                    type="url" 
                    value={galleryUrlInput}
                    onChange={(e) => setGalleryUrlInput(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs sm:text-sm min-h-[44px]" 
                    placeholder="https://images.unsplash.com/photo-..." 
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (galleryUrlInput) {
                      setGalleryImages(prev => [...prev, galleryUrlInput]);
                      setGalleryUrlInput("");
                      toast.success("URL galeriye eklendi!");
                    }
                  }}
                  className="bg-gray-800 text-white px-6 py-3 rounded-lg font-bold hover:bg-gray-900 transition min-h-[44px] flex items-center justify-center whitespace-nowrap text-xs sm:text-sm"
                >
                  Ekle
                </button>
              </div>
            )}
          </div>

          {/* GALERİ ÖNİZLEME LİSTESİ */}
          {galleryImages.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {galleryImages.map((url, index) => (
                <div key={index} className="relative aspect-square bg-white border border-gray-200 rounded-lg overflow-hidden group">
                  <Image src={url} alt={`Galeri ${index + 1}`} fill className="object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button 
                      type="button" 
                      onClick={() => setGalleryImages(prev => prev.filter((_, i) => i !== index))} 
                      className="bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-600 hover:scale-110 transition-all shadow-lg"
                      title="Kaldır"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
             <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg text-gray-400 text-sm">
                Henüz galeriye görsel eklenmedi.
             </div>
          )}
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