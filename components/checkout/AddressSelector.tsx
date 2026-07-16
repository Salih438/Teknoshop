"use client";

import { useEffect } from "react";

export default function AddressSelector({ 
  addresses, 
  selectedAddressId, 
  onSelect 
}: { 
  addresses: any[], 
  selectedAddressId: string, 
  onSelect: (id: string) => void 
}) {

  // Sayfa yüklendiğinde varsayılan bir adres varsa onu otomatik seç
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) {
      const defaultAddr = addresses.find(a => a.isDefault) || addresses[0];
      onSelect(defaultAddr.id);
    }
  }, [addresses]);

  if (addresses.length === 0) {
    return (
      <div className="bg-red-50 p-6 rounded-2xl border border-red-100 text-red-700 text-center">
        <p className="font-bold mb-2">Henüz kayıtlı bir adresiniz yok!</p>
        <p className="text-sm">Siparişi tamamlamak için lütfen profil sayfasından bir adres ekleyin.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 mb-8">
      <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2 border-b pb-4">
        <span className="text-2xl">📍</span> Teslimat Adresi
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {addresses.map((addr) => (
          <div 
            key={addr.id}
            onClick={() => onSelect(addr.id)}
            className={`cursor-pointer p-4 rounded-xl border-2 transition-all relative ${
              selectedAddressId === addr.id 
                ? 'border-blue-600 bg-blue-50/50 shadow-sm' 
                : 'border-gray-200 hover:border-blue-300'
            }`}
          >
            {/* Seçili İkonu */}
            {selectedAddressId === addr.id && (
              <div className="absolute -top-3 -right-3 bg-blue-600 text-white p-1 rounded-full shadow-md">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              </div>
            )}
            
            <h4 className="font-bold text-gray-900 mb-1">{addr.title}</h4>
            <p className="text-sm text-gray-600 line-clamp-2 mb-2">{addr.address}</p>
            <p className="text-xs font-medium text-gray-500">{addr.district}, {addr.city}</p>
          </div>
        ))}
      </div>
    </div>
  );
}