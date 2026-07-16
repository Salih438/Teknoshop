"use client";

import { useState, useEffect } from "react";
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

  useEffect(() => {
    setName(initialName);
    setPhone(initialPhone || "");
  }, [initialName, initialPhone]);

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
    const toastId = toast.loading("Profiliniz güncelleniyor...");

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Profiliniz başarıyla güncellendi! 🎉", { id: toastId });
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
        onClick={() => setIsOpen(true)}
        className="bg-white border border-gray-200 text-gray-700 px-5 py-2.5 rounded-xl font-bold hover:bg-gray-50 transition shadow-sm text-sm flex items-center gap-2 hover:scale-105"
      >
        ⚙️ Profili Düzenle
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
              title="Kapat"
            >
              ✕
            </button>

            <div className="mb-6">
              <h3 className="text-2xl font-extrabold text-gray-900">Profili Düzenle</h3>
              <p className="text-sm text-gray-500 mt-1">Adınızı, telefonunuzu ve profil fotoğrafınızı güncelleyebilirsiniz.</p>
            </div>

            {/* YENİ: PROFİL FOTOĞRAFI YÜKLEME ALANI */}
            <div className="flex flex-col items-center mb-6 bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <label className="block text-sm font-bold text-gray-700 mb-3">📷 Profil Fotoğrafı</label>
              <UploadButton
                endpoint="avatarUploader"
                onClientUploadComplete={async (res) => {
                  if (res && res.length > 0) {
                    const uploadedUrl = res[0].url;
                    const toastId = toast.loading("Fotoğraf kaydediliyor...");
                    
                    // Fotoğraf yüklendiğinde URL'i hemen veritabanına gönder
                    try {
                      await fetch("/api/profile", {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ name, phone, avatarUrl: uploadedUrl }),
                      });
                      toast.success("Profil fotoğrafı güncellendi! ☁️", { id: toastId });
                      router.refresh();
                    } catch (err) {
                      toast.error("Fotoğraf kaydedilirken hata oluştu.", { id: toastId });
                    }
                  }
                }}
                onUploadError={(error: Error) => {
                  toast.error(`Yükleme hatası: ${error.message}`);
                }}
                appearance={{
                  button: "bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-4 py-2 rounded-xl transition shadow-md",
                  allowedContent: "text-gray-400 text-xs mt-1"
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
                <label className="block text-sm font-bold text-gray-700 mb-2">👤 Ad Soyad</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Örn: Salih Balta"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 hover:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">✉️ E-posta</label>
                <input
                  type="email"
                  disabled
                  value={email}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed outline-none select-none"
                />
                <p className="text-[11px] text-gray-400 mt-1.5">(Bu alan değiştirilemez.)</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">📱 Telefon</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0533 000 00 00"
                  maxLength={11}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 hover:bg-white transition"
                />
                <p className="text-xs text-gray-400 mt-1.5">Minimum format: 05XXXXXXXXX (11 hane)</p>
              </div>

              <hr className="border-gray-100 my-5" />

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isLoading || isUnchanged}
                  className={`flex-1 text-white py-3 rounded-xl font-extrabold transition flex items-center justify-center gap-2 ${
                    isLoading || isUnchanged
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
                      : "bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg hover:-translate-y-0.5"
                  }`}
                >
                  {isLoading ? (
                    <><span className="animate-spin">⏳</span>Kaydediliyor...</>
                  ) : "Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}