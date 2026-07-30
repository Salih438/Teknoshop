"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface AddressItem {
  id: string;
  title: string;
  city: string;
  district: string;
  address: string;
  isDefault: boolean;
}

export default function AddressManager({ initialAddresses }: { initialAddresses: AddressItem[] }) {
  const router = useRouter();
  const [addresses, setAddresses] = useState(initialAddresses);
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Address Deletion Confirmation States
  const [addressToDelete, setAddressToDelete] = useState<AddressItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    city: "",
    district: "",
    address: "",
    isDefault: false,
  });

  const [prevInitialAddresses, setPrevInitialAddresses] = useState(initialAddresses);

  if (initialAddresses !== prevInitialAddresses) {
    setPrevInitialAddresses(initialAddresses);
    setAddresses(initialAddresses);
  }

  // Handle Keyboard Escape & Body Scroll Lock for Deletion Modal
  useEffect(() => {
    if (!addressToDelete) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isDeleting) {
        setAddressToDelete(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalStyle;
    };
  }, [addressToDelete, isDeleting]);

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

  // Step 1: Trigger confirmation modal (does NOT delete directly)
  const handlePromptDelete = (address: AddressItem) => {
    setAddressToDelete(address);
  };

  // Step 2: User clicks "Vazgeç" (cancels without modifying anything)
  const handleCancelDelete = () => {
    if (isDeleting) return;
    setAddressToDelete(null);
  };

  // Step 3: User confirms deletion by clicking "Adresi Sil"
  const handleConfirmDelete = async () => {
    if (!addressToDelete || isDeleting) return;

    const targetId = addressToDelete.id;
    setIsDeleting(true);

    // Optimistically remove from state
    setAddresses((prev) => prev.filter((address) => address.id !== targetId));

    try {
      const res = await fetch(`/api/addresses/${targetId}`, { method: "DELETE" });

      if (res.ok) {
        toast.success("Adres başarıyla silindi.");
        router.refresh();
      } else {
        const data = await res.json();
        setAddresses(initialAddresses);
        toast.error(data.error || "Adres silinirken bir sorun oluştu.");
      }
    } catch (error) {
      console.error(error);
      setAddresses(initialAddresses);
      toast.error("Sunucu bağlantı hatası. Adres silinemedi.");
    } finally {
      setIsDeleting(false);
      setAddressToDelete(null);
    }
  };

  const getIconForTitle = (title: string) => {
    const t = title.toLowerCase();

    if (t.includes("ev") || t.includes("aile")) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      );
    }
    if (t.includes("iş") || t.includes("ofis") || t.includes("şirket")) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      );
    }
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    );
  };

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xs border border-gray-100 overflow-hidden w-full">
      {/* BAŞLIK VE EKLE BUTONU */}
      <div className="p-4 sm:p-8 border-b border-gray-100 bg-white flex justify-between items-center gap-3">
        <h3 className="text-lg sm:text-xl font-extrabold text-gray-900">Adreslerim</h3>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-2 shadow-xs min-h-[44px] ${
            isAdding
              ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          {isAdding ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Vazgeç
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Yeni Adres Ekle
            </>
          )}
        </button>
      </div>

      {/* YENİ ADRES EKLEME FORMU */}
      {isAdding && (
        <div className="p-4 sm:p-8 border-b border-gray-100 bg-gray-50/50 animate-in slide-in-from-top-4 fade-in duration-300">
          <form onSubmit={handleAddAddress} className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-1.5">
                  Adres Başlığı
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Örn: Ev Adresi, Ofis, Yazlık"
                  className="w-full px-3.5 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-xs sm:text-sm min-h-[44px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-1.5">İl</label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Örn: İstanbul"
                    className="w-full px-3.5 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-xs sm:text-sm min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-1.5">İlçe</label>
                  <input
                    type="text"
                    required
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    placeholder="Örn: Kadıköy"
                    className="w-full px-3.5 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-xs sm:text-sm min-h-[44px]"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-1.5">Açık Adres</label>
              <textarea
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Mahalle, Sokak, No, Daire..."
                rows={3}
                className="w-full px-3.5 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none bg-white text-xs sm:text-sm"
              ></textarea>
            </div>

            <label className="flex items-center gap-3 bg-white p-3.5 rounded-xl border border-gray-200 cursor-pointer min-h-[44px]">
              <input
                type="checkbox"
                checked={formData.isDefault}
                onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer min-h-[20px] min-w-[20px]"
              />
              <span className="text-xs sm:text-sm font-extrabold text-gray-700">
                Bu adresi varsayılan teslimat adresim yap
              </span>
            </label>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full text-white py-3.5 rounded-xl font-extrabold transition-all text-sm sm:text-base shadow-xs flex justify-center items-center gap-2 min-h-[44px] ${
                isLoading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isLoading ? "Kaydediliyor..." : "Adresi Kaydet"}
            </button>
          </form>
        </div>
      )}

      {/* KAYITLI ADRESLERİ LİSTELEME */}
      <div className="p-4 sm:p-8 bg-gray-50/30">
        {addresses.length === 0 ? (
          <div className="text-center py-12 sm:py-16 border-2 border-dashed border-gray-200 rounded-2xl sm:rounded-3xl bg-white flex flex-col items-center justify-center p-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 sm:h-10 sm:w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-gray-900 font-extrabold text-lg sm:text-xl mb-1.5">Henüz kayıtlı adresiniz yok</p>
            <p className="text-gray-500 text-xs sm:text-sm mb-6 max-w-sm">Alışverişlerinizi daha hızlı ve güvenli tamamlamak için ilk teslimat adresinizi ekleyin.</p>
            <button
              onClick={() => setIsAdding(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-extrabold hover:bg-blue-700 transition-all flex items-center gap-2 text-xs sm:text-sm min-h-[44px]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              İlk Adresini Ekle
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
            {addresses.map((address) => (
              <div
                key={address.id}
                className={`p-4 sm:p-6 rounded-2xl sm:rounded-3xl border-2 relative bg-white transition-all ${
                  address.isDefault
                    ? "border-blue-500 shadow-xs ring-2 ring-blue-500/10"
                    : "border-gray-100 hover:border-gray-300"
                }`}
              >
                {address.isDefault && (
                  <span className="absolute -top-3 left-4 bg-blue-600 text-white text-[9px] font-extrabold tracking-widest uppercase px-2.5 py-0.5 rounded-md shadow-xs">
                    Varsayılan
                  </span>
                )}

                <div className="flex justify-between items-center mb-3 mt-0.5">
                  <h4 className="font-extrabold text-gray-900 flex items-center gap-2 text-base">
                    <span
                      className={`p-1.5 rounded-lg flex items-center justify-center ${
                        address.isDefault ? "bg-blue-50 text-blue-600" : "bg-gray-50 text-gray-500"
                      }`}
                    >
                      {getIconForTitle(address.title)}
                    </span>
                    {address.title}
                  </h4>

                  <button
                    type="button"
                    onClick={() => handlePromptDelete(address)}
                    className="p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors border border-transparent hover:border-red-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
                    title="Sil"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-3 text-xs sm:text-sm text-gray-600 bg-gray-50/50 p-3.5 rounded-2xl border border-gray-100">
                  <p className="flex items-start gap-2.5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="line-clamp-2 leading-relaxed font-medium break-words">{address.address}</span>
                  </p>
                  <p className="flex items-center gap-2.5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span className="font-bold text-gray-800">{address.district}, {address.city}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ADRES SİLME ONAY MODALI */}
      {addressToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={handleCancelDelete}
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
          aria-describedby="delete-dialog-desc"
        >
          <div
            className="bg-white w-full max-w-md rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-4 mx-auto sm:mx-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>

            <h3 id="delete-dialog-title" className="text-lg sm:text-xl font-extrabold text-gray-900 text-center sm:text-left">
              Adresi Sil
            </h3>
            <p id="delete-dialog-desc" className="text-xs sm:text-sm text-gray-500 mt-1.5 mb-6 text-center sm:text-left leading-relaxed">
              Bu adresi silmek istediğinize emin misiniz? (<strong>{addressToDelete.title}</strong>)
            </p>

            <div className="flex flex-col-reverse sm:flex-row gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={handleCancelDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl font-extrabold text-gray-700 hover:bg-gray-50 transition text-xs sm:text-sm min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-extrabold px-5 py-3 rounded-xl transition text-xs sm:text-sm min-h-[44px] shadow-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Siliniyor...
                  </>
                ) : (
                  "Adresi Sil"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}