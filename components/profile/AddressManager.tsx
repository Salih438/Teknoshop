"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

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
        router.refresh(); 
      } else {
        alert("Adres eklenirken bir sorun oluştu.");
      }
    } catch (error) {
      console.error(error);
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
        router.refresh();
      } else {
        // Hata durumunda backend'den gelen mesajı yakalayıp kullanıcıya gösteriyoruz
        const data = await res.json();
        setAddresses(initialAddresses); // Adresi ekrana geri getir
        alert(data.error || "Adres silinirken bir sorun oluştu.");
      }
    } catch (error) {
      console.error(error);
      setAddresses(initialAddresses); 
      alert("Sunucuya bağlanılamadı.");
    }
  };

  // Dinamik ikon belirleyici
  const getIconForTitle = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes("ev") || t.includes("aile")) return "🏠";
    if (t.includes("iş") || t.includes("ofis") || t.includes("şirket")) return "🏢";
    if (t.includes("yazlık")) return "🏖️";
    return "📍";
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-8">
      
      {/* BAŞLIK VE EKLE BUTONU */}
      <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
        <h3 className="text-xl font-bold text-gray-900">📍 Adreslerim</h3>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-800 transition shadow-sm"
        >
          {isAdding ? "Vazgeç" : "+ Yeni Adres Ekle"}
        </button>
      </div>

      {/* YENİ ADRES EKLEME FORMU */}
      {isAdding && (
        <div className="p-6 border-b border-gray-100 bg-white">
          <form onSubmit={handleAddAddress} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Adres Başlığı</label>
                <input 
                  type="text" required value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Örn: Ev Adresi, Ofis, Yazlık" 
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">İl</label>
                  <input 
                    type="text" required value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    placeholder="Örn: İstanbul" 
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">İlçe</label>
                  <input 
                    type="text" required value={formData.district}
                    onChange={(e) => setFormData({...formData, district: e.target.value})}
                    placeholder="Örn: Kadıköy" 
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50" 
                  />
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Açık Adres</label>
              <textarea 
                required value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                placeholder="Mahalle, Sokak, No, Daire..." 
                rows={3} 
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none bg-gray-50"
              ></textarea>
            </div>

            {/* Varsayılan Yap Seçeneği */}
            <div className="flex items-center gap-3 bg-blue-50 p-4 rounded-xl border border-blue-100">
              <input 
                type="checkbox" 
                id="isDefault" 
                checked={formData.isDefault}
                onChange={(e) => setFormData({...formData, isDefault: e.target.checked})}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="isDefault" className="text-sm font-bold text-blue-900 cursor-pointer">
                Bu adresi varsayılan teslimat adresim yap
              </label>
            </div>

            <button 
              type="submit" disabled={isLoading}
              className={`w-full text-white py-3.5 rounded-xl font-extrabold transition text-lg ${isLoading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700 hover:-translate-y-1 hover:shadow-lg'}`}
            >
              {isLoading ? "Kaydediliyor..." : "Adresi Kaydet"}
            </button>
          </form>
        </div>
      )}

      {/* KAYITLI ADRESLERİ LİSTELEME */}
      <div className="p-6 bg-gray-50/30">
        {addresses.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl bg-white">
            <span className="text-5xl block mb-4">📍</span>
            <p className="text-gray-900 font-bold text-lg mb-2">Henüz kayıtlı adresiniz bulunmuyor.</p>
            <p className="text-gray-500 text-sm mb-6">Siparişlerinizi hızlıca tamamlamak için ilk adresinizi ekleyin.</p>
            <button 
              onClick={() => setIsAdding(true)}
              className="bg-blue-50 text-blue-700 px-6 py-2.5 rounded-xl font-bold hover:bg-blue-100 transition"
            >
              + İlk Adresini Ekle
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {addresses.map((address) => (
              <div key={address.id} className={`p-5 rounded-2xl border-2 relative group bg-white transition-all ${address.isDefault ? 'border-blue-500 shadow-md' : 'border-gray-200 hover:border-gray-300'}`}>
                
                {/* Varsayılan Etiketi */}
                {address.isDefault && (
                  <span className="absolute -top-3 left-5 bg-blue-600 text-white text-xs font-extrabold px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
                    ⭐ Varsayılan
                  </span>
                )}

                <div className="flex justify-between items-start mb-4 mt-1">
                  <h4 className="font-extrabold text-gray-900 flex items-center gap-2 text-lg">
                    {getIconForTitle(address.title)} {address.title}
                  </h4>
                  
                  {/* Profesyonel Aksiyon Butonları (Düzenle ve Sil) */}
                  <div className="flex gap-2">
                    <button className="p-2 text-gray-400 hover:bg-gray-100 hover:text-blue-600 rounded-lg transition" title="Düzenle">
                      ✏️
                    </button>
                    <button 
                      onClick={() => handleDeleteAddress(address.id)}
                      className="p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition" 
                      title="Sil"
                    >
                      🔴 🗑️
                    </button>
                  </div>
                </div>
                
                <div className="space-y-3 text-sm text-gray-600">
                  <p className="flex items-start gap-2">
                    <span className="text-gray-400 mt-0.5">📍</span>
                    <span className="line-clamp-2 leading-relaxed">{address.address}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="text-gray-400">🏙️</span>
                    <span className="font-medium text-gray-800">{address.district}, {address.city}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="text-gray-400">📞</span>
                    <span className="font-medium text-gray-800">0533 795 73 29</span>
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