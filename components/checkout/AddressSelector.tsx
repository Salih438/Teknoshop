"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

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
  onNoteChange?: (note: string) => void; 
}

export default function AddressSelector({ 
  addresses: initialAddresses, 
  selectedAddressId, 
  onSelect,
  onNoteChange 
}: AddressSelectorProps) {
  
  const [localAddresses, setLocalAddresses] = useState<Address[]>(initialAddresses);
  const [orderNote, setOrderNote] = useState("");
  const [isAddingNew, setIsAddingNew] = useState(initialAddresses.length === 0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    city: "",
    district: "",
    address: "",
  });

  useEffect(() => {
    if (localAddresses.length > 0 && !selectedAddressId) {
      const defaultAddr = localAddresses.find(a => a.isDefault) || localAddresses[0];
      onSelect(defaultAddr.id);
    }
  }, [localAddresses, selectedAddressId, onSelect]);

  useEffect(() => {
    setLocalAddresses(initialAddresses);
    if (initialAddresses.length === 0) {
      setIsAddingNew(true);
    } else {
      setIsAddingNew(false);
    }
  }, [initialAddresses]);

  useEffect(() => {
    if (onNoteChange) {
      onNoteChange(orderNote);
    }
  }, [orderNote, onNoteChange]);

  const handleAddNewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.title.length < 2 || formData.city.length < 2 || formData.district.length < 2 || formData.address.length < 10) {
      toast.error("Lütfen tüm alanları eksiksiz ve geçerli şekilde doldurun.");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Adresiniz kaydediliyor...");

    try {
      const res = await fetch("/api/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, isDefault: localAddresses.length === 0 }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success("Adres başarıyla eklendi!", { id: toastId });
        const newAddr = data.address;
        
        setLocalAddresses(prev => [newAddr, ...prev]);
        onSelect(newAddr.id);
        setIsAddingNew(false);
        setFormData({ title: "", city: "", district: "", address: "" });
      } else {
        toast.error(data.error || "Adres eklenirken bir hata oluştu.", { id: toastId });
      }
    } catch {
      toast.error("Bağlantı hatası. İnternetinizi kontrol edin.", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-5 sm:p-8 rounded-2xl shadow-xs border border-gray-100 mb-6 sm:mb-8 animate-in fade-in duration-500 w-full overflow-x-clip">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-4 mb-6 gap-3">
        <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 flex items-center gap-3">
          <span className="bg-blue-50 text-blue-600 p-2 rounded-xl">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </span>
          Teslimat Adresi
        </h2>
        
        {!isAddingNew && (
          <button 
            type="button"
            onClick={() => setIsAddingNew(true)} 
            className="text-xs sm:text-sm font-extrabold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5 w-full sm:w-auto min-h-[44px]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
            Yeni Adres Ekle
          </button>
        )}
      </div>

      {isAddingNew ? (
        <div className="bg-gray-50/70 border border-gray-200 rounded-2xl p-4 sm:p-6 mb-6 animate-in fade-in zoom-in-95">
          <div className="flex justify-between items-center mb-4 border-b border-gray-200 pb-3">
            <h3 className="font-extrabold text-gray-900 text-base sm:text-lg">Yeni Adres Bilgileri</h3>
            {localAddresses.length > 0 && (
              <button type="button" onClick={() => setIsAddingNew(false)} className="text-gray-400 hover:text-gray-600 transition bg-white p-1.5 rounded-lg shadow-xs border border-gray-200 min-h-[36px] min-w-[36px] flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-1">Adres Başlığı</label>
              <input type="text" placeholder="Ev, İş vb." value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm min-h-[44px]" required />
            </div>
            <div>
              <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-1">Şehir</label>
              <input type="text" placeholder="İstanbul" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="w-full border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm min-h-[44px]" required />
            </div>
            <div>
              <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-1">İlçe</label>
              <input type="text" placeholder="Kadıköy" value={formData.district} onChange={e => setFormData({...formData, district: e.target.value})} className="w-full border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm min-h-[44px]" required />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-1">Açık Adres</label>
              <textarea placeholder="Mahalle, sokak, bina no, kapı no vb." rows={3} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm resize-none" required></textarea>
            </div>
          </div>
          
          <div className="mt-5 flex justify-end">
            <button 
              type="button"
              onClick={handleAddNewSubmit}
              disabled={isSubmitting}
              className="bg-blue-600 text-white font-extrabold px-6 py-3 rounded-xl hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-xs w-full sm:w-auto text-sm min-h-[44px]"
            >
              {isSubmitting ? (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              )}
              Kaydet ve Kullan
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {localAddresses.map((addr) => {
            const isSelected = selectedAddressId === addr.id;
            return (
              <div 
                key={addr.id}
                onClick={() => onSelect(addr.id)}
                className={`cursor-pointer p-4 sm:p-5 rounded-2xl border-2 transition-all relative group ${
                  isSelected 
                    ? 'border-blue-600 bg-blue-50/40 shadow-sm ring-2 ring-blue-600/20' 
                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                }`}
              >
                {isSelected && (
                  <div className="absolute -top-2.5 -right-2.5 bg-blue-600 text-white p-1 rounded-full shadow-sm animate-in zoom-in duration-200">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  </div>
                )}
                
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="font-bold text-gray-900 text-sm">{addr.title}</h4>
                  {addr.isDefault && (
                    <span className="text-[9px] uppercase font-extrabold tracking-wider bg-gray-900 text-white px-2 py-0.5 rounded-md">
                      Varsayılan
                    </span>
                  )}
                </div>
                
                <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mb-2 break-words leading-relaxed">{addr.address}</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{addr.district}, {addr.city}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* SİPARİŞ NOTU */}
      <div className="pt-4 border-t border-gray-100">
        <label htmlFor="orderNote" className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-2">
          Sipariş Notu (İsteğe Bağlı)
        </label>
        <textarea
          id="orderNote"
          rows={2}
          value={orderNote}
          onChange={(e) => setOrderNote(e.target.value)}
          placeholder="Örn: Zile basmayın, kapıya bırakabilirsiniz..."
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-xs sm:text-sm resize-none"
        ></textarea>
      </div>

    </div>
  );
}