"use client";

import { useState, useRef } from "react";
import { useCartStore } from "@/lib/store";
import Link from "next/link";
import toast from "react-hot-toast";
import FavoriteButton from "@/components/FavoriteButton"; 
import ProductReviews from "@/components/ProductReviews";

export default function ProductDetails({ product }: { product: any }) {
  const addItem = useCartStore((state) => state.addItem);
  const tabsRef = useRef<HTMLDivElement>(null); // Tıklayınca sekmelere kaydırmak için
  
  // Güvenli Veri Çekimi
  const imageList = product?.imageUrl ? [product.imageUrl] : [];  
  const stock = product?.stock ?? 25; 
  const brandName = product?.brand?.name || "Belirtilmemiş";
  const categoryName = product?.category?.name || "Kategori Yok";
  const inStock = stock > 0;

  // Etkileşim State'leri
  const [mainImage, setMainImage] = useState(imageList[0] || "");
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("desc");

  // DİNAMİK YORUM VE YILDIZ HESAPLAMASI
  const totalReviews = product?.reviews?.length || 0;
  const averageRating = totalReviews > 0 
    ? (product.reviews.reduce((acc: any, curr: any) => acc + curr.rating, 0) / totalReviews).toFixed(1)
    : "0.0";

  // Sepete Ekleme Fonksiyonu
  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      imageUrls: imageList, 
      quantity: quantity, 
    });
    toast.success(`${quantity} adet ${product.name} sepete eklendi! 🛒`);
  };

  // Yorumlara Tıklayınca Sekmeye Kaydıran Fonksiyon
  const scrollToReviews = () => {
    setActiveTab("reviews");
    tabsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 mt-4 animate-in fade-in duration-500">
      
      {/* --- ÜST KISIM (BREADCRUMB) --- */}
      <div className="text-sm text-gray-500 mb-6 flex items-center gap-2">
        <Link href="/" className="hover:text-blue-600 transition-colors">Ana Sayfa</Link>
        <span>/</span>
        <Link href="/products" className="hover:text-blue-600 transition-colors">Ürünler</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium truncate">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        
        {/* --- MODÜL 1: GÖRSEL GALERİSİ (SOL) --- */}
        <div className="space-y-4">
          <div className="h-[500px] bg-gray-50 rounded-2xl flex items-center justify-center p-4 border border-gray-100 overflow-hidden relative group">
            {mainImage ? (
              <img 
                src={mainImage} 
                alt={product.name} 
                className="max-w-full max-h-full object-contain transform transition-transform duration-500 group-hover:scale-125 cursor-zoom-in" 
              />
            ) : (
              <span className="text-gray-400 font-medium">Görsel Yok</span>
            )}
            
            <div className="absolute top-4 right-4 z-10">
              <FavoriteButton 
                productId={product.id} 
                initialIsFavorite={product?.favorites?.length > 0} 
              />
            </div>
          </div>

          {imageList.length > 1 && (
            <div className="flex gap-4 overflow-x-auto py-2 custom-scrollbar">
              {imageList.map((img: string, idx: number) => (
                <div 
                  key={idx} 
                  onClick={() => setMainImage(img)}
                  className={`w-24 h-24 flex-shrink-0 rounded-xl bg-gray-50 p-2 cursor-pointer border-2 transition-all ${mainImage === img ? 'border-blue-600 shadow-md' : 'border-transparent hover:border-gray-300'}`}
                >
                  <img src={img} alt={`Görsel ${idx + 1}`} className="w-full h-full object-contain" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* --- MODÜL 2: ÜRÜN DETAYLARI VE AKSİYONLAR (SAĞ) --- */}
        <div className="flex flex-col">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2 leading-tight">{product.name}</h1>
          
          {/* DİNAMİK YILDIZ ALANI */}
          <div className="flex items-center gap-4 mb-6 border-b border-gray-100 pb-6">
            <div className="flex items-center gap-1">
              <div className="flex text-yellow-400 text-lg">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span key={star}>{star <= Math.round(Number(averageRating)) ? "★" : "☆"}</span>
                ))}
              </div>
              {totalReviews > 0 ? (
                <>
                  <span className="text-sm font-bold text-gray-700 ml-1">{averageRating}</span>
                  <span 
                    onClick={scrollToReviews}
                    className="text-sm text-gray-500 underline ml-1 cursor-pointer hover:text-blue-600 transition-colors"
                  >
                    ({totalReviews} Değerlendirme)
                  </span>
                </>
              ) : (
                <span className="text-sm text-gray-400 ml-2 font-medium">Henüz değerlendirilmedi</span>
              )}
            </div>
          </div>

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

          {/* Özellikler Kartı */}
          <div className="bg-gray-50 p-6 rounded-2xl mb-8 space-y-3 border border-gray-100">
            <div className="flex justify-between border-b border-gray-200 pb-2">
              <span className="text-gray-500 font-medium">Marka</span>
              <span className="text-gray-900 font-bold">{brandName}</span>
            </div>
            <div className="flex justify-between border-b border-gray-200 pb-2">
              <span className="text-gray-500 font-medium">Kategori</span>
              <span className="text-gray-900 font-bold">{categoryName}</span>
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

      {/* --- MODÜL 3: SEKMELER (TABS) --- */}
      <div ref={tabsRef} className="mt-16 bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden scroll-mt-8">
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
            Değerlendirmeler ({totalReviews})
          </button>
        </div>

        <div className="p-8">
          {activeTab === "desc" && (
            <div className="prose max-w-none text-gray-700 leading-relaxed">
              <h3 className="text-xl font-bold text-gray-900 mb-4">{product.name} Hakkında</h3>
              <div className="whitespace-pre-wrap">
                {product.description || "Bu ürün için henüz detaylı bir açıklama girilmemiştir."}
              </div>
            </div>
          )}

          {activeTab === "specs" && (
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Donanım ve Teknik Özellikler</h3>
              <table className="w-full text-sm text-left text-gray-500 border-collapse">
                <tbody>
                  <tr className="border-b border-gray-100"><th className="py-3 px-4 font-medium text-gray-900 bg-gray-50 w-1/3">Marka</th><td className="py-3 px-4">{brandName}</td></tr>
                  <tr className="border-b border-gray-100"><th className="py-3 px-4 font-medium text-gray-900 bg-gray-50 w-1/3">Model</th><td className="py-3 px-4">{product.name}</td></tr>
                  <tr className="border-b border-gray-100"><th className="py-3 px-4 font-medium text-gray-900 bg-gray-50 w-1/3">Garanti Süresi</th><td className="py-3 px-4">24 Ay</td></tr>
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "reviews" && (
            <ProductReviews productId={product.id} />
          )}
        </div>
      </div>
    </div>
  );
}