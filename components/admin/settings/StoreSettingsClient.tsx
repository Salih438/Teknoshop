"use client";

import { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";

export default function StoreSettingsClient() {
  const [shippingCompany, setShippingCompany] = useState("Yurtiçi Kargo");
  const [shippingFee, setShippingFee] = useState(149.99);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(5000.00);
  
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [workingHours, setWorkingHours] = useState("");
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          setShippingCompany(data.shippingCompany || "Yurtiçi Kargo");
          setShippingFee(data.shippingFee ?? 149.99);
          setFreeShippingThreshold(data.freeShippingThreshold ?? 5000.00);
          setPhone(data.phone || "");
          setEmail(data.email || "");
          setAddress(data.address || "");
          setWorkingHours(data.workingHours || "");
        }
      } catch (error) {
        console.error("Ayarlar çekilemedi:", error);
        toast.error("Ayarlar yüklenirken bir hata oluştu.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (shippingFee < 0 || freeShippingThreshold < 0) {
      toast.error("Kargo ücreti ve ücretsiz kargo barajı negatif olamaz.");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Ayarlar kaydediliyor...");

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          shippingCompany,
          shippingFee: parseFloat(shippingFee.toString()),
          freeShippingThreshold: parseFloat(freeShippingThreshold.toString()),
          phone,
          email,
          address,
          workingHours,
        }),
      });

      if (res.ok) {
        toast.success("Mağaza ayarları başarıyla güncellendi!", { id: toastId });
      } else {
        const errorData = await res.json();
        toast.error(`Kayıt başarısız: ${errorData.error}`, { id: toastId });
      }
    } catch (error) {
      console.error("Kaydetme hatası:", error);
      toast.error("Sunucuya bağlanılamadı.", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="h-64 bg-gray-100 rounded-xl"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500">
      <Toaster position="bottom-right" />
      
      <div className="mb-8 border-b border-gray-100 pb-6">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">⚙️ Mağaza Ayarları</h1>
        <p className="text-gray-500 mt-2">Kargo ücretleri ve genel mağaza politikalarını buradan yönetebilirsiniz.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
            Kargo Ayarları
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Kargo Şirketi</label>
              <input 
                type="text" 
                value={shippingCompany} 
                onChange={(e) => setShippingCompany(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                placeholder="Örn: Yurtiçi Kargo"
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Sabit Kargo Ücreti (₺)</label>
              <div className="relative">
                <input 
                  type="number" 
                  step="0.01"
                  min="0"
                  value={shippingFee} 
                  onChange={(e) => setShippingFee(parseFloat(e.target.value) || 0)}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                />
                <span className="absolute left-4 top-3 text-gray-500 font-bold">₺</span>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">Ücretsiz Kargo Barajı (₺)</label>
              <div className="relative">
                <input 
                  type="number" 
                  step="0.01"
                  min="0"
                  value={freeShippingThreshold} 
                  onChange={(e) => setFreeShippingThreshold(parseFloat(e.target.value) || 0)}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                  placeholder="Örn: 5000"
                />
                <span className="absolute left-4 top-3 text-gray-500 font-bold">₺</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Sepet tutarı bu değeri aşarsa kargo ücreti <strong>0 TL</strong> olur.
              </p>
            </div>
          </div>
          
          <div className="mt-8 mb-4 border-t border-gray-100 pt-8">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-6">
              📞 Mağaza İletişim Bilgileri
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Telefon Numarası</label>
                <input 
                  type="text" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                  placeholder="Örn: +90 850 123 45 67"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">E-Posta Adresi</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                  placeholder="Örn: destek@vitrin.com"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Çalışma Saatleri</label>
                <input 
                  type="text" 
                  value={workingHours} 
                  onChange={(e) => setWorkingHours(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                  placeholder="Örn: Pzt-Cum 09:00 - 18:00"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">Açık Adres</label>
                <textarea 
                  value={address} 
                  onChange={(e) => setAddress(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition resize-none"
                  placeholder="Örn: Levent Mah. Çiçek Sok. No: 12 Beşiktaş/İstanbul"
                />
              </div>
            </div>
          </div>
          
          <div className="pt-6 border-t border-gray-100 flex justify-end">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition disabled:bg-blue-400 disabled:cursor-not-allowed shadow-sm flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Kaydediliyor...
                </>
              ) : (
                "Değişiklikleri Kaydet"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
