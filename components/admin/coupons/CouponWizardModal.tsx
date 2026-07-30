"use client";

import { useState } from "react";
import toast from "react-hot-toast";

interface CouponWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CouponWizardModal({ isOpen, onClose, onSuccess }: CouponWizardModalProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form State
  const [code, setCode] = useState("");
  const [campaignType, setCampaignType] = useState("PERCENTAGE");
  const [discount, setDiscount] = useState<number>(10);
  const [minAmount, setMinAmount] = useState<string>("");
  const [usageLimit, setUsageLimit] = useState<number>(100);
  const [isSingleUse, setIsSingleUse] = useState(false);
  const [expireDate, setExpireDate] = useState("");

  if (!isOpen) return null;

  const handleNextStep = () => {
    if (step === 1 && !code.trim()) {
      toast.error("Lütfen bir kupon kodu giriniz.");
      return;
    }
    if (step === 2 && (discount <= 0 || isNaN(discount))) {
      toast.error("Lütfen geçerli bir indirim değeri giriniz.");
      return;
    }
    if (step === 4 && !expireDate) {
      toast.error("Lütfen son kullanma tarihi seçiniz.");
      return;
    }
    setStep((prev) => Math.min(prev + 1, 5));
  };

  const handlePrevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    const toastId = toast.loading("Kampanya oluşturuluyor...");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/coupons/quick-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "createCoupon",
          code,
          discount,
          minAmount: minAmount ? Number(minAmount) : null,
          isSingleUse,
          usageLimit,
          expireDate,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Kampanya kuponu başarıyla oluşturuldu! 🎉", { id: toastId });
        onSuccess();
        onClose();
        // Reset Form
        setStep(1);
        setCode("");
      } else {
        toast.error(data.error || "Oluşturma başarısız.", { id: toastId });
      }
    } catch (error) {
      toast.error("Sunucu hatası oluştu.", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 text-left">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-gray-100 p-6 sm:p-8 relative overflow-hidden flex flex-col justify-between max-h-[90vh]">
        
        {/* MODAL HEADER */}
        <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎟️</span>
            <h3 className="text-lg sm:text-xl font-black text-gray-900">Kampanya & Kupon Sihirbazı</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-xs flex items-center justify-center transition"
          >
            ✕
          </button>
        </div>

        {/* STEPPER PROGESS BAR (RESPONSIVE DİKEY / YATAY) */}
        <div className="mb-6 bg-gray-50 p-3 rounded-2xl border border-gray-200/80">
          <div className="flex items-center justify-between text-xs font-bold">
            {[
              { num: 1, label: "Temel" },
              { num: 2, label: "İndirim" },
              { num: 3, label: "Kurallar" },
              { num: 4, label: "Tarihler" },
              { num: 5, label: "Onay" },
            ].map((s) => (
              <div
                key={s.num}
                onClick={() => s.num < step && setStep(s.num)}
                className={`flex items-center gap-1.5 cursor-pointer transition ${
                  step === s.num
                    ? "text-blue-600 font-black scale-105"
                    : s.num < step
                    ? "text-green-600 font-bold"
                    : "text-gray-400"
                }`}
              >
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${
                    step === s.num
                      ? "bg-blue-600 text-white shadow-xs"
                      : s.num < step
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {s.num < step ? "✓" : s.num}
                </span>
                <span className="hidden sm:inline">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* STEPPER STEP CONTENT */}
        <div className="flex-1 overflow-y-auto custom-scrollbar py-2 space-y-4 text-xs sm:text-sm">
          
          {/* STEP 1: TEMEL BİLGİLER */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div>
                <label className="block font-extrabold text-gray-900 mb-1">Kupon Kodu (Büyük Harf)</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="Örn: YAZ2026 veya VIP100"
                  className="w-full border border-gray-200 rounded-xl p-3 bg-gray-50 focus:bg-white font-mono font-bold text-sm tracking-wider uppercase outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-extrabold text-gray-900 mb-2">Kampanya İndirim Türü</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "PERCENTAGE", title: "Yüzde İndirimi (%)", desc: "Örn: %15 İndirim" },
                    { id: "FIXED", title: "Sabit Tutar (TL)", desc: "Örn: 100 TL İndirim" },
                    { id: "FREE_SHIPPING", title: "Ücretsiz Kargo", desc: "Kargocreti 0 TL" },
                    { id: "FIRST_ORDER", title: "İlk Sipariş İndirimi", desc: "Yeni Müşterilere Özel" },
                  ].map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setCampaignType(t.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition ${
                        campaignType === t.id
                          ? "bg-blue-50/80 border-blue-500 text-blue-900 font-bold shadow-xs"
                          : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <p className="font-extrabold">{t.title}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">{t.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: İNDİRİM KURALLARI */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div>
                <label className="block font-extrabold text-gray-900 mb-1">
                  {campaignType === "PERCENTAGE" ? "İndirim Oranı (%)" : "İndirim Tutarı (₺)"}
                </label>
                <input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  min={1}
                  className="w-full border border-gray-200 rounded-xl p-3 bg-gray-50 focus:bg-white font-extrabold text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-extrabold text-gray-900 mb-1">
                  Minimum Sepet Tutarı (₺) (Opsiyonel)
                </label>
                <input
                  type="number"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                  placeholder="Örn: 500 (Boş bırakılırsa limit yok)"
                  className="w-full border border-gray-200 rounded-xl p-3 bg-gray-50 focus:bg-white font-extrabold text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* STEP 3: KULLANIM KURALLARI */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div>
                <label className="block font-extrabold text-gray-900 mb-1">Toplam Kullanım Limiti (Adet)</label>
                <input
                  type="number"
                  value={usageLimit}
                  onChange={(e) => setUsageLimit(Number(e.target.value))}
                  min={1}
                  className="w-full border border-gray-200 rounded-xl p-3 bg-gray-50 focus:bg-white font-extrabold text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-3 p-3 bg-blue-50/50 rounded-2xl border border-blue-100">
                <input
                  type="checkbox"
                  id="singleUseModal"
                  checked={isSingleUse}
                  onChange={(e) => setIsSingleUse(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <label htmlFor="singleUseModal" className="font-extrabold text-blue-900 cursor-pointer">
                  Kişiye Özel (Her müşteri sadece 1 kez kullanabilir)
                </label>
              </div>
            </div>
          )}

          {/* STEP 4: GEÇERLİLİK TARİHLERİ */}
          {step === 4 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div>
                <label className="block font-extrabold text-gray-900 mb-1">Son Kullanma Tarihi ve Saati</label>
                <input
                  type="datetime-local"
                  value={expireDate}
                  onChange={(e) => setExpireDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-3 bg-gray-50 focus:bg-white font-extrabold text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* STEP 5: ÖNİZLEME VE ONAY */}
          {step === 5 && (
            <div className="space-y-4 animate-in fade-in duration-200 bg-gray-50 p-5 rounded-2xl border border-gray-200">
              <h4 className="font-black text-gray-900 text-base border-b border-gray-200 pb-2">Kampanya Özeti</h4>
              
              <div className="space-y-2 font-medium text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Kupon Kodu:</span>
                  <span className="font-mono font-black text-blue-600 text-sm tracking-wider">{code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">İndirim Miktarı:</span>
                  <span className="font-extrabold text-emerald-600">
                    {campaignType === "PERCENTAGE" ? `%${discount}` : `${discount} TL`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Min. Sepet Tutarı:</span>
                  <span className="font-bold text-gray-900">
                    {minAmount ? `${Number(minAmount).toLocaleString("tr-TR")} ₺` : "Limit Yok"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Kullanım Limiti:</span>
                  <span className="font-bold text-gray-900">{usageLimit} Adet</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Kullanıcı Kısıtı:</span>
                  <span className="font-bold text-blue-800">{isSingleUse ? "Kişiye Özel (1 Hak)" : "Sınırsız Kullanım"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Son Kullanma Tarihi:</span>
                  <span className="font-bold text-red-600">{new Date(expireDate).toLocaleString("tr-TR")}</span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* MODAL FOOTER AKSİYONLARI */}
        <div className="mt-6 border-t border-gray-100 pt-4 flex justify-between gap-3">
          {step > 1 ? (
            <button
              onClick={handlePrevStep}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-extrabold px-5 py-2.5 rounded-xl text-xs sm:text-sm transition min-h-[44px]"
            >
              &larr; Geri
            </button>
          ) : (
            <div />
          )}

          {step < 5 ? (
            <button
              onClick={handleNextStep}
              className="bg-gray-900 hover:bg-gray-800 text-white font-extrabold px-6 py-2.5 rounded-xl text-xs sm:text-sm transition min-h-[44px]"
            >
              Devam Et &rarr;
            </button>
          ) : (
            <button
              disabled={loading}
              onClick={handleSubmit}
              className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-6 py-2.5 rounded-xl text-xs sm:text-sm transition shadow-sm min-h-[44px]"
            >
              🚀 Kampanyayı Oluştur ve Yayına Al
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
