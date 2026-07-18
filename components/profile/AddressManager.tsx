"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function AddressManager({ initialAddresses }: { initialAddresses: any[] }) {
  const router = useRouter();
  const [addresses, setAddresses] = useState(initialAddresses);
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    city: "",
    district: "",
    address: "",
    isDefault: false
  });

  useEffect(() => {
    setAddresses(initialAddresses);
  }, [initialAddresses]);

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("/api/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setFormData({ title: "", city: "", district: "", address: "", isDefault: false }); 
        setIsAdding(false); 
        toast.success("Adres başarıyla eklendi!");
        router.refresh(); 
      } else {
        toast.error("Adres eklenirken bir sorun oluştu.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Sunucuya bağlanılamadı.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!window.confirm("Bu adresi silmek istediğinize emin misiniz?")) return;

    // Arayüzden anında siliyoruz (Optimistic UI)
    setAddresses(prev => prev.filter(address => address.id !== id));

    try {
      const res = await fetch(`/api/addresses/${id}`, { method: "DELETE" });
      
      if (res.ok) {
        toast.success("Adres başarıyla silindi.");
        router.refresh();
      } else {
        const data = await res.json();
        setAddresses(initialAddresses); // Adresi ekrana geri getir
        toast.error(data.error || "Adres silinirken bir sorun oluştu.");
      }
    } catch (error) {
      console.error(error);
      setAddresses(initialAddresses); 
      toast.error("Sunucu bağlantı hatası. Adres silinemedi.");
    }
  };

  // 🚀 Zekice düşünülmüş bu fonksiyonu artık profesyonel SVG'ler döndürecek şekilde güncelledik
  const getIconForTitle = (title: string) => {
    const t = title.toLowerCase();
    
    // Ev İkonu
    if (t.includes("ev") || t.includes("aile")) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      );
    }
    // İş / Ofis İkonu
    if (t.includes("iş") || t.includes("ofis") || t.includes("şirket")) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      );
    }
    // Genel Konum / Yazlık İkonu
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    );
  };

  return (
    <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden">
      
      {/* BAŞLIK VE EKLE BUTONU */}
      <div className="p-6 sm:p-8 border-b border-gray-100 bg-white flex justify-between items-center">
        <h3 className="text-xl font-extrabold text-gray-900">Adreslerim</h3>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-sm ${
            isAdding 
              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
              : 'bg-blue-600 text-white hover:bg-blue-700 hover:-translate-y-0.5 hover:shadow-md'
          }`}
        >
          {isAdding ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              Vazgeç
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Yeni Adres Ekle
            </>
          )}
        </button>
      </div>

      {/* YENİ ADRES EKLEME FORMU */}
      {isAdding && (
        <div className="p-6 sm:p-8 border-b border-gray-100 bg-gray-50/50 animate-in slide-in-from-top-4 fade-in duration-300">
          <form onSubmit={handleAddAddress} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-extrabold text-gray-700 mb-2">Adres Başlığı</label>
                <input 
                  type="text" required value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Örn: Ev Adresi, Ofis, Yazlık" 
                  className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white transition-shadow shadow-sm" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-extrabold text-gray-700 mb-2">İl</label>
                  <input 
                    type="text" required value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    placeholder="Örn: İstanbul" 
                    className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white transition-shadow shadow-sm" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-extrabold text-gray-700 mb-2">İlçe</label>
                  <input 
                    type="text" required value={formData.district}
                    onChange={(e) => setFormData({...formData, district: e.target.value})}
                    placeholder="Örn: Kadıköy" 
                    className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white transition-shadow shadow-sm" 
                  />
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-extrabold text-gray-700 mb-2">Açık Adres</label>
              <textarea 
                required value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                placeholder="Mahalle, Sokak, No, Daire..." 
                rows={3} 
                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none bg-white transition-shadow shadow-sm"
              ></textarea>
            </div>

            {/* Varsayılan Yap Seçeneği */}
            <label className="flex items-center gap-3 bg-white p-4 rounded-xl border border-gray-200 cursor-pointer hover:bg-blue-50/50 hover:border-blue-200 transition-colors group">
              <input 
                type="checkbox" 
                checked={formData.isDefault}
                onChange={(e) => setFormData({...formData, isDefault: e.target.checked})}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-sm font-bold text-gray-700 group-hover:text-blue-900 transition-colors">
                Bu adresi varsayılan teslimat adresim yap
              </span>
            </label>

            <button 
              type="submit" disabled={isLoading}
              className={`w-full text-white py-4 rounded-xl font-extrabold transition-all text-lg shadow-md flex justify-center items-center gap-2 ${
                isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:-translate-y-0.5 hover:shadow-lg'
              }`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                  Kaydediliyor...
                </>
              ) : (
                "Adresi Kaydet"
              )}
            </button>
          </form>
        </div>
      )}

      {/* KAYITLI ADRESLERİ LİSTELEME */}
      <div className="p-6 sm:p-8 bg-gray-50/30">
        {addresses.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-3xl bg-white flex flex-col items-center justify-center animate-in fade-in">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-gray-900 font-extrabold text-xl mb-2">Henüz kayıtlı adresiniz yok</p>
            <p className="text-gray-500 text-sm mb-8 max-w-sm">Alışverişlerinizi daha hızlı ve güvenli tamamlamak için ilk teslimat adresinizi şimdi ekleyin.</p>
            <button 
              onClick={() => setIsAdding(true)}
              className="bg-blue-600 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              İlk Adresini Ekle
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {addresses.map((address) => (
              <div key={address.id} className={`p-6 rounded-3xl border-2 relative group bg-white transition-all duration-300 ${address.isDefault ? 'border-blue-500 shadow-md ring-4 ring-blue-50' : 'border-gray-100 hover:border-gray-300 hover:shadow-sm'}`}>
                
                {/* Varsayılan Etiketi */}
                {address.isDefault && (
                  <span className="absolute -top-3.5 left-6 bg-blue-600 text-white text-[10px] font-extrabold tracking-widest uppercase px-3 py-1 rounded-md shadow-sm flex items-center gap-1.5 animate-in zoom-in">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                    Varsayılan
                  </span>
                )}

                <div className="flex justify-between items-start mb-5 mt-1">
                  <h4 className="font-extrabold text-gray-900 flex items-center gap-2.5 text-lg">
                    <span className={`p-2 rounded-lg flex items-center justify-center ${address.isDefault ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-500'}`}>
                      {getIconForTitle(address.title)}
                    </span>
                    {address.title}
                  </h4>
                  
                  {/* Profesyonel Aksiyon Butonları (Düzenle ve Sil) */}
                  <div className="flex gap-1.5">
                    <button className="p-2 text-gray-400 hover:bg-gray-50 hover:text-blue-600 rounded-lg transition-colors border border-transparent hover:border-gray-200" title="Düzenle">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <button 
                      onClick={() => handleDeleteAddress(address.id)}
                      className="p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors border border-transparent hover:border-red-100" 
                      title="Sil"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
                
                <div className="space-y-4 text-sm text-gray-600 bg-gray-50/50 p-4 rounded-2xl border border-gray-50">
                  <p className="flex items-start gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    <span className="line-clamp-2 leading-relaxed font-medium">{address.address}</span>
                  </p>
                  <p className="flex items-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                    <span className="font-bold text-gray-800">{address.district}, {address.city}</span>
                  </p>
                  <p className="flex items-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                    <span className="font-bold text-gray-800">0533 795 73 29</span>
                  </p>
                </div>
                
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}