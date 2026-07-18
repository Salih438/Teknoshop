"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function OrderSuccessPage() {
  const [orderNumber, setOrderNumber] = useState("");

  // Hydration hatasını önlemek için sipariş numarasını istemci tarafında üretiyoruz
  // İleride burayı backend'den gelen gerçek sipariş numarası (Örn: searchParams.orderId) ile değiştirebilirsin
  useEffect(() => {
    const randomId = Math.floor(10000000 + Math.random() * 90000000);
    setOrderNumber(`VT-${randomId}`);
  }, []);

  return (
    <div className="min-h-[80vh] bg-white flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] border border-gray-100 p-8 md:p-10 text-center animate-in fade-in zoom-in duration-500">
        
        {/* Onay İkonu */}
        <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner relative">
          <div className="absolute inset-0 border-4 border-green-100 rounded-full animate-ping opacity-20"></div>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {/* Başlık ve Mesaj */}
        <h1 className="text-3xl font-extrabold text-gray-900 mb-3 tracking-tight">Siparişiniz Alındı!</h1>
        <p className="text-gray-500 text-sm leading-relaxed mb-6">
          Harika bir seçim! Siparişiniz başarıyla oluşturuldu. Teslimat süreciyle ilgili detayları kısa süre içinde e-posta adresinize göndereceğiz.
        </p>

        {/* Sipariş Numarası Kutusu */}
        <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-4 mb-8">
          <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1">Sipariş Numarası</p>
          <p className="text-xl font-mono font-extrabold text-blue-600">
            {orderNumber || "Yükleniyor..."}
          </p>
        </div>

        {/* Aksiyon Butonları */}
        <div className="space-y-3">
          <Link 
            href="/profile" 
            className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            Siparişlerimi Takip Et
          </Link>
          <Link 
            href="/products" 
            className="flex items-center justify-center gap-2 w-full bg-white text-gray-700 border-2 border-gray-100 py-3.5 rounded-xl font-bold hover:bg-gray-50 hover:border-gray-200 transition-all"
          >
            Alışverişe Devam Et
          </Link>
        </div>

        {/* Bilgilendirme Dipnotu */}
        <p className="text-xs text-gray-400 mt-8 font-medium">
          Sorularınız için <span className="text-blue-600 cursor-pointer hover:underline">Müşteri Hizmetleri</span> ile iletişime geçebilirsiniz.
        </p>

      </div>
    </div>
  );
}