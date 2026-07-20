"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// 1. TİP GÜVENLİĞİ: 'any' yerine verinin ne olduğunu açıkça belirtiyoruz
export interface Address {
  id: string;
  title: string;
  city: string;
  district: string;
  address: string;
  postalCode?: string | null;
  isDefault: boolean;
}

interface AddressSelectorProps {
  addresses: Address[];
  selectedAddressId: string;
  onSelect: (id: string) => void;
  // SİPARİŞ NOTU İÇİN YENİ EKLENDİ (Opsiyonel)
  onNoteChange?: (note: string) => void; 
}

export default function AddressSelector({ 
  addresses, 
  selectedAddressId, 
  onSelect,
  onNoteChange 
}: AddressSelectorProps) {
  
  const [orderNote, setOrderNote] = useState("");

  // Sayfa yüklendiğinde varsayılan bir adres varsa onu otomatik seç
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) {
      const defaultAddr = addresses.find(a => a.isDefault) || addresses[0];
      onSelect(defaultAddr.id);
    }
  }, [addresses, selectedAddressId, onSelect]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sipariş notu değiştiğinde üst bileşene (CheckoutPage) bildir
  useEffect(() => {
    if (onNoteChange) {
      onNoteChange(orderNote);
    }
  }, [orderNote, onNoteChange]);

  // 2. UX İYİLEŞTİRMESİ: Adres yoksa yönlendirici ve şık bir Empty State göster
  if (addresses.length === 0) {
    return (
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-red-100 flex flex-col items-center justify-center text-center animate-in fade-in">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Teslimat Adresi Bulunamadı</h3>
        <p className="text-gray-500 mb-6 max-w-md">Siparişinize devam edebilmek için hesabınıza en az bir teslimat adresi eklemeniz gerekmektedir.</p>
        <Link href="/profile" className="bg-blue-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-sm">
          Adres Eklemeye Git
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 mb-8 animate-in fade-in duration-500">
      
      <h2 className="text-xl font-extrabold text-gray-900 mb-6 flex items-center gap-3 border-b border-gray-100 pb-4">
        <span className="bg-blue-50 text-blue-600 p-2 rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </span>
        Teslimat Adresi Seçin
      </h2>
      
      {/* ADRES LİSTESİ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {addresses.map((addr) => (
          <div 
            key={addr.id}
            onClick={() => onSelect(addr.id)}
            className={`cursor-pointer p-5 rounded-xl border-2 transition-all relative group ${
              selectedAddressId === addr.id 
                ? 'border-blue-600 bg-blue-50/30 shadow-md scale-[1.02]' 
                : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
            }`}
          >
            {/* Seçili İkonu */}
            {selectedAddressId === addr.id && (
              <div className="absolute -top-3 -right-3 bg-blue-600 text-white p-1.5 rounded-full shadow-md animate-in zoom-in duration-200">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              </div>
            )}
            
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-gray-900">{addr.title}</h4>
              {addr.isDefault && (
                <span className="text-[10px] uppercase font-bold tracking-wider bg-gray-900 text-white px-2 py-0.5 rounded-md">
                  Varsayılan
                </span>
              )}
            </div>
            
            <p className="text-sm text-gray-600 line-clamp-2 mb-3 h-10">{addr.address}</p>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{addr.district}, {addr.city}</p>
          </div>
        ))}
      </div>

      {/* 3. EKLENTİ: SİPARİŞ NOTU */}
      <div className="pt-6 border-t border-gray-100">
        <label htmlFor="orderNote" className="block text-sm font-bold text-gray-700 mb-2">
          Sipariş Notu (İsteğe Bağlı)
        </label>
        <textarea
          id="orderNote"
          rows={2}
          value={orderNote}
          onChange={(e) => setOrderNote(e.target.value)}
          placeholder="Örn: Zile basmayın, site güvenliğine bırakın..."
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm resize-none"
        ></textarea>
      </div>

    </div>
  );
}