"use client";
import Image from "next/image";


import { useState } from "react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";

interface VariantInfo {
  id: string | number;
  color: string | null;
  storage: string | null;
  price: string | number | null;
  stock: number;
}

interface EditProductFormProps {
  product: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    price: number;
    stock: number;
    categoryId: string | null;
    brandId: string | null;
    sku: string | null;
    isActive: boolean;
    images: { imageUrl: string }[];
    variants?: VariantInfo[]; // 🚀 Veritabanından gelen mevcut varyasyonlar
  };
  categories: { id: string; name: string }[];
  brands: { id: string; name: string }[];
}

export default function EditProductForm({ product, categories, brands }: EditProductFormProps) {
  const router = useRouter();
  
  const existingImage = product.images?.length > 0 ? product.images[0].imageUrl : "";
  const [imageUrl, setImageUrl] = useState(existingImage);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🚀 VARYASYON STATE'LERİ (Mevcut varyasyonlarla başlatıyoruz)
  const [hasVariants, setHasVariants] = useState<boolean>(Boolean(product.variants && product.variants.length > 0));
  const [variants, setVariants] = useState<VariantInfo[]>(
    product.variants?.map(v => ({
      id: v.id,
      color: v.color || "",
      storage: v.storage || "",
      price: v.price !== null ? v.price.toString() : "",
      stock: v.stock ?? 0,
    })) || []
  );

  const addVariant = () => {
    setVariants([...variants, { id: `temp-${Date.now()}`, color: "", storage: "", price: "", stock: 0 }]);
  };

  const removeVariant = (id: string | number) => {
    setVariants(variants.filter((v) => v.id !== id));
  };

  const updateVariant = (id: string | number, field: keyof VariantInfo, value: string | number) => {
    setVariants(variants.map((v) => (v.id === id ? { ...v, [field]: value } : v)));
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    
    if (hasVariants && variants.length === 0) {
      toast.error("Varyasyon seçeneğini aktif ettiniz ancak varyasyon bırakmadınız.");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Ürün güncelleniyor...");
    
    const formData = new FormData(e.currentTarget);
    
    const isActive = e.currentTarget.isActive.checked;
    formData.set("isActive", isActive.toString());
    formData.set("imageUrl", imageUrl);

    // 🚀 Varyasyonları JSON string olarak formData'ya ekliyoruz
    if (hasVariants && variants.length > 0) {
      formData.set("variants", JSON.stringify(variants));
    } else {
      formData.set("variants", JSON.stringify([]));
    }
    
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
        const errorData = await res.json();
        toast.error(`Güncelleme başarısız: ${errorData.error || "Bilinmeyen hata"}`, { id: toastId });
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
      <Toaster position="bottom-right" reverseOrder={false} />

      {/* 1. BÖLÜM: TEMEL ÜRÜN BİLGİLERİ */}
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
            <select name="categoryId" defaultValue={product.categoryId || ""} required className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white transition">
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Marka</label>
            <select name="brandId" defaultValue={product.brandId || ""} required className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white transition">
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>{brand.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ana Fiyat (TL)</label>
            <div className="relative">
              <input type="number" name="price" step="0.01" defaultValue={product.price} required className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" />
              <span className="absolute left-3 top-2.5 text-gray-500 font-medium">₺</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ana Stok Miktarı</label>
            <input type="number" name="stock" defaultValue={product.stock} required className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Stok Kodu (SKU)</label>
            <input type="text" name="sku" defaultValue={product.sku || ""} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" placeholder="Örn: APP-IP16-256" />
          </div>

          <div className="flex items-center mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <input 
              type="checkbox" 
              name="isActive" 
              id="isActive" 
              defaultChecked={product.isActive} 
              className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer" 
            />
            <label htmlFor="isActive" className="ml-3 text-sm font-bold text-gray-800 cursor-pointer">
              Ürünü Vitrinde Yayınla (Aktif)
            </label>
          </div>

        </div>
      </div>

      {/* 🚀 2. BÖLÜM: VARYASYON YÖNETİM MODÜLÜ */}
      <div className="bg-white rounded-xl shadow-sm border border-blue-100 overflow-hidden p-6 bg-blue-50/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">🎨 Ürün Varyasyonları</h2>
            <p className="text-xs text-gray-500 mt-1">Bu ürün için renk ve hafıza seçeneklerini güncelleyin.</p>
          </div>
          
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" checked={hasVariants} onChange={(e) => {
              setHasVariants(e.target.checked);
              if (e.target.checked && variants.length === 0) addVariant();
            }} />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            <span className="ml-3 text-sm font-bold text-gray-700">Seçenekleri Aktif Et</span>
          </label>
        </div>

        {hasVariants && (
          <div className="mt-6 space-y-4">
            {variants.map((variant) => (
              <div key={variant.id} className="flex flex-wrap md:flex-nowrap items-start gap-4 p-4 bg-white border border-gray-200 rounded-xl shadow-sm relative">
                
                <div className="flex-1 min-w-[120px]">
                  <label className="block text-xs font-bold text-gray-500 mb-1">Renk Seçeneği</label>
                  <input type="text" value={variant.color || ""} onChange={(e) => updateVariant(variant.id, "color", e.target.value)} placeholder="Siyah, Mavi vs." className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                
                <div className="flex-1 min-w-[120px]">
                  <label className="block text-xs font-bold text-gray-500 mb-1">Hafıza / Beden</label>
                  <input type="text" value={variant.storage || ""} onChange={(e) => updateVariant(variant.id, "storage", e.target.value)} placeholder="128GB, 256GB vs." className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                
                <div className="flex-1 min-w-[120px]">
                  <label className="block text-xs font-bold text-gray-500 mb-1">Özel Fiyat (₺)</label>
                  <input type="number" step="0.01" value={variant.price ?? ""} onChange={(e) => updateVariant(variant.id, "price", e.target.value)} placeholder="Ana fiyat geçerli olur" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                
                <div className="w-24 min-w-[80px]">
                  <label className="block text-xs font-bold text-gray-500 mb-1">Stok</label>
                  <input type="number" required value={variant.stock} onChange={(e) => updateVariant(variant.id, "stock", parseInt(e.target.value) || 0)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>

                <button type="button" onClick={() => removeVariant(variant.id)} className="mt-6 p-2 text-red-500 hover:bg-red-50 rounded-lg transition" title="Bu seçeneği sil">
                  ✕
                </button>
              </div>
            ))}

            <button type="button" onClick={addVariant} className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-800 transition px-2 py-1">
              <span>+</span> Yeni Seçenek Ekle
            </button>
          </div>
        )}
      </div>

      {/* 3. BÖLÜM: ÜRÜN AÇIKLAMASI */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">📝 Ürün Açıklaması</h2>
        </div>
        <div className="p-6">
          <textarea name="description" rows={5} defaultValue={product.description || ""} required className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition placeholder-gray-400"></textarea>
        </div>
      </div>

      {/* 4. BÖLÜM: GÖRSEL YÖNETİMİ */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">📷 Görsel Yönetimi</h2>
        </div>
        <div className="p-6 flex flex-col md:flex-row gap-8 items-start">
          <div className="flex-1 w-full space-y-4">
            <label className="block text-sm font-medium text-gray-700">Birincil Görsel URL</label>
            <input 
              type="url" 
              required 
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" 
            />
          </div>
          
          <div className="w-full md:w-56 h-56 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center overflow-hidden relative">
            {imageUrl ? (
              <Image src={imageUrl} alt="Önizleme" className="max-w-full max-h-full object-contain p-2" width={500} height={500} />
            ) : (
              <div className="text-center text-gray-400">
                <span className="text-3xl block mb-2">📸</span>
                <span className="text-sm font-medium">Görsel Önizleme</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. BÖLÜM: AKSİYON BUTONLARI */}
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