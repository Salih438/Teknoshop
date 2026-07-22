"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { UploadButton } from "@/lib/utils/uploadthing";

interface EditProfileModalProps {
  initialName: string;
  initialPhone: string | null;
  email: string;
}

export default function EditProfileModal({ initialName, initialPhone, email }: EditProfileModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone || "");

  // State'i useEffect ile senkronize etmek yerine modal açılırken set ediyoruz

  const isUnchanged = name.trim() === initialName.trim() && phone.trim() === (initialPhone || "").trim();

  const isPhoneValid = (num: string) => {
    if (num === "") return true;
    return /^05\d{9}$/.test(num);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (phone && !isPhoneValid(phone)) {
      toast.error("Telefon numarası '05XXXXXXXXX' formatında (11 haneli) olmalıdır.");
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading("Profiliniz güvenle güncelleniyor...");

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Profiliniz başarıyla güncellendi!", { id: toastId });
        setIsOpen(false);
        router.refresh();
      } else {
        const errorMsg = data.error || "Güncelleme başarısız oldu.";
        toast.error(errorMsg, { id: toastId });
      }
    } catch (error) {
      console.error(error);
      toast.error("Sunucuya bağlanırken bir hata oluştu.", { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => {
          setName(initialName);
          setPhone(initialPhone || "");
          setIsOpen(true);
        }}
        className="bg-white border border-gray-200 text-gray-700 px-5 py-2.5 rounded-xl font-bold hover:bg-gray-50 transition-all shadow-sm text-sm flex items-center gap-2 hover:scale-105 hover:border-blue-200 hover:text-blue-600"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Profili Düzenle
      </button>

      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        >
          <div 
            className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-all"
              title="Kapat"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="mb-6 pr-6">
              <h3 className="text-2xl font-extrabold text-gray-900">Profili Düzenle</h3>
              <p className="text-sm text-gray-500 mt-1.5">Adınızı, telefonunuzu ve profil fotoğrafınızı buradan güncelleyebilirsiniz.</p>
            </div>

            {/* PROFİL FOTOĞRAFI YÜKLEME ALANI */}
            <div className="flex flex-col items-center mb-6 bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Profil Fotoğrafı
              </label>
              <UploadButton
                endpoint="avatarUploader"
                onClientUploadComplete={async (res) => {
                  if (res && res.length > 0) {
                    const uploadedUrl = res[0].url;
                    const toastId = toast.loading("Fotoğraf kaydediliyor...");
                    
                    try {
                      await fetch("/api/profile", {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ name, phone, avatarUrl: uploadedUrl }),
                      });
                      toast.success("Profil fotoğrafı güncellendi!", { id: toastId });
                      router.refresh();
                    } catch {
                      toast.error("Fotoğraf kaydedilirken hata oluştu.", { id: toastId });
                    }
                  }
                }}
                onUploadError={(error: Error) => {
                  toast.error(`Yükleme hatası: ${error.message}`);
                }}
                appearance={{
                  button: "bg-gray-900 hover:bg-gray-800 text-white font-bold text-sm px-6 py-2.5 rounded-xl transition-all shadow-sm",
                  allowedContent: "text-gray-400 text-[10px] uppercase tracking-wider font-bold mt-2"
                }}
                content={{
                  button({ ready }) {
                    if (ready) return <div>Fotoğraf Seç</div>;
                    return "Hazırlanıyor...";
                  }
                }}
              />
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Ad Soyad
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Örn: Salih Balta"
                  className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 hover:bg-white transition-all"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  E-posta
                </label>
                <input
                  type="email"
                  disabled
                  value={email}
                  className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-100/70 text-gray-500 cursor-not-allowed outline-none select-none font-medium"
                />
                <p className="text-[11px] text-gray-400 mt-1.5 font-medium flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  Bu alan güvenlik nedeniyle değiştirilemez.
                </p>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Telefon
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Örn: 0533 795 73 29"
                  maxLength={11}
                  className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 hover:bg-white transition-all font-medium"
                />
                <p className="text-[11px] text-gray-400 mt-1.5 font-medium">Format: 05 ile başlayan 11 haneli numara</p>
              </div>

              <div className="pt-2">
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="flex-1 bg-gray-100 text-gray-700 py-3.5 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || isUnchanged}
                    className={`flex-1 text-white py-3.5 rounded-xl font-extrabold transition-all flex items-center justify-center gap-2 ${
                      isLoading || isUnchanged
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed shadow-none"
                        : "bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg hover:-translate-y-0.5"
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white/80" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                        Kaydediliyor
                      </>
                    ) : "Değişiklikleri Kaydet"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}