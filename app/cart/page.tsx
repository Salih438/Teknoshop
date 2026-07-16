"use client";

import Link from "next/link";
import { useCartStore } from "@/lib/store";

export default function CartPage() {
  // Zustand hafızasından gerekli tüm fonksiyonları ve ürünleri çekiyoruz
  const { items, removeItem, increaseQuantity, decreaseQuantity } = useCartStore();

  // Sepetteki ürünlerin (Fiyat x Adet) toplamını hesaplıyoruz
  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="py-8 max-w-5xl mx-auto px-4 mt-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Sepetiniz</h1>

      {items.length === 0 ? (
        <div className="text-center p-12 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-medium text-gray-700 mb-4">Sepetiniz şu an boş.</h2>
          <Link href="/products" className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
            Ürünlere Göz At
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Sol Taraf: Ürün Listesi */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                
                {/* 🚀 LİNK EKLENDİ & imageUrls (DİZİ) YAPISI KORUNDU */}
                <div className="w-24 h-24 flex-shrink-0 bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center p-2 relative group cursor-pointer">
                  <Link href={`/products/${item.id}`} className="w-full h-full flex items-center justify-center">
                    {item.imageUrls && item.imageUrls.length > 0 ? (
                      <img src={item.imageUrls[0]} alt={item.name} className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform" />
                    ) : (
                      <span className="text-xs text-gray-400 font-medium">Görsel Yok</span>
                    )}
                  </Link>
                </div>
                
                <div className="flex-grow text-center sm:text-left w-full">
                  {/* 🚀 LİNK EKLENDİ: İsme tıklayınca da ürün detayına gider */}
                  <Link href={`/products/${item.id}`}>
                    <h3 className="font-bold text-lg text-gray-900 truncate max-w-[200px] md:max-w-xs hover:text-blue-600 hover:underline transition-colors">
                      {item.name}
                    </h3>
                  </Link>
                  <p className="text-blue-600 font-bold mt-1">{item.price.toLocaleString('tr-TR')} TL</p>
                </div>
                
                {/* Miktar Kontrolü ve Silme Butonu */}
                <div className="flex flex-col items-center gap-3 w-full sm:w-auto">
                  
                  {/* + / - Buton Grubu */}
                  <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50">
                    <button 
                      onClick={() => decreaseQuantity(item.id)}
                      disabled={item.quantity <= 1}
                      className="px-3 py-1 text-gray-600 hover:bg-gray-200 rounded-l-lg transition disabled:opacity-50"
                    >
                      -
                    </button>
                    <span className="px-4 py-1 font-bold text-gray-900 border-x border-gray-200 bg-white">
                      {item.quantity}
                    </span>
                    <button 
                      onClick={() => increaseQuantity(item.id)}
                      disabled={item.quantity >= 10}
                      className="px-3 py-1 text-gray-600 hover:bg-gray-200 rounded-r-lg transition disabled:opacity-50"
                    >
                      +
                    </button>
                  </div>
                  
                  {/* Kaldır Butonu */}
                  <button 
                    onClick={() => removeItem(item.id)}
                    className="text-red-500 text-sm font-semibold hover:text-red-700 transition-colors flex items-center gap-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Kaldır
                  </button>
                </div>
                
              </div>
            ))}
          </div>

          {/* Sağ Taraf: Sipariş Özeti */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit sticky top-24">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Sipariş Özeti</h3>
            
            <div className="space-y-3 mb-6 text-gray-600">
              <div className="flex justify-between">
                <span>Ara Toplam</span>
                <span className="font-medium text-gray-900">{total.toLocaleString('tr-TR')} TL</span>
              </div>
              <div className="flex justify-between">
                <span>Kargo</span>
                <span className="text-green-600 font-medium">Ücretsiz</span>
              </div>
            </div>

            <div className="flex justify-between items-center font-extrabold text-2xl mt-4 pt-4 border-t border-gray-200">
              <span className="text-gray-900">Toplam</span>
              <span className="text-blue-600">{total.toLocaleString('tr-TR')} TL</span>
            </div>
            
            <Link href="/checkout" className="block w-full">
              <button className="w-full mt-8 bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition-colors shadow-sm">
                Alışverişi Tamamla
              </button>
            </Link>
          </div>
          
        </div>
      )}
    </div>
  );
}