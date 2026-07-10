"use client";

import { useState } from "react";
import { useCartStore } from "@/lib/store";
import Link from "next/link";

export default function ProductDetails({ product }: { product: any }) {
  const addItem = useCartStore((state) => state.addItem);
  
  // Etkileşim State'leri (Hafızaları)
  const [mainImage, setMainImage] = useState(product.imageUrls?.[0] || "");
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("desc"); // desc, specs, reviews
  const [isFavorite, setIsFavorite] = useState(false);

  // Veritabanında henüz olmayan özellikler için şimdilik Mock (Sahte) Veriler
  const stock = product.stock ?? 25; // Gerçek stok gelene kadar 25 varsayıyoruz
  const brand = product.brand || "Sony";
  const category = product.category || "Oyun Konsolu";
  const inStock = stock > 0;

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      imageUrls: product.imageUrls || [],
      quantity: quantity, // Seçilen miktarı doğrudan sepete yolluyoruz
    });
    alert(`${quantity} adet ${product.name} sepete eklendi! 🛒`);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 mt-4 animate-in fade-in duration-500">
      
      {/* Üst Kısım (Breadcrumb) */}
      <div className="text-sm text-gray-500 mb-6 flex items-center gap-2">
        <Link href="/" className="hover:text-blue-600">Ana Sayfa</Link>
        <span>/</span>
        <Link href="/products" className="hover:text-blue-600">Ürünler</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium truncate">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        
        {/* SOL TARAF: GÖRSEL GALERİSİ */}
        <div className="space-y-4">
          {/* Ana Büyük Görsel */}
          <div className="h-[500px] bg-gray-50 rounded-2xl flex items-center justify-center p-4 border border-gray-100 overflow-hidden relative group">
            {mainImage ? (
              <img 
                src={mainImage} 
                alt={product.name} 
                className="max-w-full max-h-full object-contain transform transition-transform duration-500 group-hover:scale-125 cursor-zoom-in" 
              />
            ) : (
              <span className="text-gray-400">Görsel Yok</span>
            )}
            
            {/* Favori Butonu (Resmin Üzerinde) */}
            <button 
              onClick={() => setIsFavorite(!isFavorite)}
              className="absolute top-4 right-4 bg-white p-3 rounded-full shadow-md hover:scale-110 transition-transform"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 transition-colors ${isFavorite ? 'text-red-500 fill-current' : 'text-gray-400'}`} viewBox="0 0 24 24" stroke="currentColor" fill={isFavorite ? "currentColor" : "none"}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
          </div>

          {/* Küçük Resimler (Thumbnails) */}
          {product.imageUrls && product.imageUrls.length > 1 && (
            <div className="flex gap-4 overflow-x-auto py-2 custom-scrollbar">
              {product.imageUrls.map((img: string, idx: number) => (
                <div 
                  key={idx} 
                  onClick={() => setMainImage(img)}
                  className={`w-24 h-24 flex-shrink-0 rounded-xl bg-gray-50 p-2 cursor-pointer border-2 transition-all ${mainImage === img ? 'border-blue-600 shadow-md' : 'border-transparent hover:border-gray-300'}`}
                >
                  <img src={img} alt="Thumbnail" className="w-full h-full object-contain" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SAĞ TARAF: ÜRÜN DETAYLARI VE SATIN ALMA */}
        <div className="flex flex-col">
          {/* Başlık ve Yıldızlar */}
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2 leading-tight">{product.name}</h1>
          
          <div className="flex items-center gap-4 mb-6 border-b border-gray-100 pb-6">
            <div className="flex items-center gap-1">
              <div className="flex text-yellow-400 text-lg">★★★★★</div>
              <span className="text-sm font-bold text-gray-700 ml-1">4.8</span>
              <span className="text-sm text-gray-500 underline ml-1 cursor-pointer hover:text-blue-600">(152 Değerlendirme)</span>
            </div>
          </div>

          {/* Fiyat ve Badgeler */}
          <div className="mb-8">
            <div className="text-4xl font-extrabold text-blue-600 mb-4">{product.price.toLocaleString('tr-TR')} ₺</div>
            <div className="flex flex-wrap gap-3">
              <span className={`px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1 ${inStock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {inStock ? '✔ Stokta' : '✖ Tükendi'}
              </span>
              <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                🚚 Ücretsiz Kargo
              </span>
              <span className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                💳 12 Aya Varan Taksit
              </span>
            </div>
          </div>

          {/* Kısa Özellikler (Specs) */}
          <div className="bg-gray-50 p-6 rounded-2xl mb-8 space-y-3 border border-gray-100">
            <div className="flex justify-between border-b border-gray-200 pb-2">
              <span className="text-gray-500 font-medium">Marka</span>
              <span className="text-gray-900 font-bold">{brand}</span>
            </div>
            <div className="flex justify-between border-b border-gray-200 pb-2">
              <span className="text-gray-500 font-medium">Kategori</span>
              <span className="text-gray-900 font-bold">{category}</span>
            </div>
            <div className="flex justify-between border-b border-gray-200 pb-2">
              <span className="text-gray-500 font-medium">Garanti</span>
              <span className="text-gray-900 font-bold">2 Yıl Türkiye Garantili</span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-gray-500 font-medium">Stok Kodu</span>
              <span className="text-gray-900 font-mono text-sm">{product.id.substring(0, 8).toUpperCase()}</span>
            </div>
          </div>

          <div className="flex-1"></div>

          {/* Sepete Ekle Aksiyonları */}
          <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center p-6 bg-white border border-gray-200 rounded-2xl shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] sticky bottom-4 z-10">
            
            {/* Miktar Seçici */}
            <div className="flex items-center border-2 border-gray-200 rounded-xl bg-gray-50 w-full sm:w-auto">
              <button 
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="px-4 py-3 text-gray-600 hover:bg-gray-200 hover:text-black rounded-l-xl transition font-bold text-xl"
              >-</button>
              <span className="px-6 py-3 font-extrabold text-gray-900 bg-white border-x-2 border-gray-200 w-16 text-center">
                {quantity}
              </span>
              <button 
                onClick={() => setQuantity(q => Math.min(stock, q + 1))}
                className="px-4 py-3 text-gray-600 hover:bg-gray-200 hover:text-black rounded-r-xl transition font-bold text-xl"
              >+</button>
            </div>

            {/* Sepete Ekle Butonu */}
            <button 
              onClick={handleAddToCart}
              disabled={!inStock}
              className={`flex-1 w-full py-4 rounded-xl font-extrabold text-lg flex items-center justify-center gap-2 transition-all shadow-md ${
                inStock 
                  ? 'bg-blue-600 text-white hover:bg-blue-700 hover:-translate-y-1 hover:shadow-lg' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {inStock ? 'Sepete Ekle' : 'Tükendi'}
            </button>
          </div>
        </div>
      </div>

      {/* ALT KISIM: SEKMELER (TABS) */}
      <div className="mt-16 bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-200 bg-gray-50 overflow-x-auto">
          <button 
            onClick={() => setActiveTab("desc")} 
            className={`px-8 py-4 font-bold text-sm transition-colors whitespace-nowrap ${activeTab === 'desc' ? 'bg-white text-blue-600 border-t-2 border-blue-600' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
          >
            Ürün Açıklaması
          </button>
          <button 
            onClick={() => setActiveTab("specs")} 
            className={`px-8 py-4 font-bold text-sm transition-colors whitespace-nowrap ${activeTab === 'specs' ? 'bg-white text-blue-600 border-t-2 border-blue-600' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
          >
            Teknik Özellikler
          </button>
          <button 
            onClick={() => setActiveTab("reviews")} 
            className={`px-8 py-4 font-bold text-sm transition-colors whitespace-nowrap ${activeTab === 'reviews' ? 'bg-white text-blue-600 border-t-2 border-blue-600' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
          >
            Değerlendirmeler (152)
          </button>
        </div>

        <div className="p-8">
          {activeTab === "desc" && (
            <div className="prose max-w-none text-gray-700 leading-relaxed">
              <h3 className="text-xl font-bold text-gray-900 mb-4">{product.name} Hakkında</h3>
              <p>{product.description || "Bu ürün için henüz detaylı bir açıklama girilmemiştir. Lütfen daha sonra tekrar kontrol ediniz."}</p>
            </div>
          )}
          {activeTab === "specs" && (
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Donanım ve Teknik Özellikler</h3>
              <table className="w-full text-sm text-left text-gray-500 border-collapse">
                <tbody>
                  <tr className="border-b border-gray-100"><th className="py-3 px-4 font-medium text-gray-900 bg-gray-50 w-1/3">Marka</th><td className="py-3 px-4">{brand}</td></tr>
                  <tr className="border-b border-gray-100"><th className="py-3 px-4 font-medium text-gray-900 bg-gray-50 w-1/3">Model</th><td className="py-3 px-4">{product.name}</td></tr>
                  <tr className="border-b border-gray-100"><th className="py-3 px-4 font-medium text-gray-900 bg-gray-50 w-1/3">Bağlantı</th><td className="py-3 px-4">Wi-Fi 6, Bluetooth 5.1</td></tr>
                  <tr className="border-b border-gray-100"><th className="py-3 px-4 font-medium text-gray-900 bg-gray-50 w-1/3">Garanti Süresi</th><td className="py-3 px-4">24 Ay</td></tr>
                </tbody>
              </table>
            </div>
          )}
          {activeTab === "reviews" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <h3 className="text-xl font-bold text-gray-900">Müşteri Yorumları</h3>
                <button className="text-blue-600 font-bold hover:underline">Yorum Yap</button>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex text-yellow-400 text-sm">★★★★★</div>
                  <span className="font-bold text-gray-900">Ahmet Y.</span>
                  <span className="text-xs text-gray-400 flex items-center gap-1"><span className="text-green-500">✔</span> Onaylı Alıcı</span>
                </div>
                <p className="text-gray-700 text-sm">Ürün elime çok hızlı ulaştı. Paketleme harikaydı, kesinlikle tavsiye ederim. Fiyat performans olarak piyasanın en iyisi.</p>
                <span className="text-xs text-gray-400 mt-2 block">12 Mayıs 2026</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}