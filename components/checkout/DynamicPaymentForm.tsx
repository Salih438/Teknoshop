"use client";

import { useState } from "react";
import toast from "react-hot-toast";

interface BankAccountDTO {
  id: string;
  bankName: string;
  accountHolder: string;
  iban: string;
  currency: string;
}

interface PaymentMethodDTO {
  id: string;
  name: string;
  description: string | null;
  type: "CREDIT_CARD" | "BANK_TRANSFER" | "CASH_ON_DELIVERY" | "DIGITAL_WALLET" | "INSTALLMENT";
  provider: string;
  fee: number;
  icon?: string | null;
  bankAccounts?: BankAccountDTO[];
}

export default function DynamicPaymentForm({ selectedMethod }: { selectedMethod: PaymentMethodDTO }) {
  // KREDİ KARTI STATE'LERİ (CANLI FORMATLAMA VE VIRTUAL CARD DISPLAY)
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvc, setCvc] = useState("");
  const [isFlipped, setIsFlipped] = useState(false);

  // KART NUMARASI FORMATLAMA (4'LÜ GRUPLAR)
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 16);
    const formatted = val.replace(/(.{4})/g, "$1 ").trim();
    setCardNumber(formatted);
  };

  // SON KULLANMA TARİHİ FORMATLAMA (MM/YY)
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (val.length >= 3) {
      setExpiryDate(`${val.slice(0, 2)}/${val.slice(2)}`);
    } else {
      setExpiryDate(val);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} kopyalandı! 📋`);
  };

  // 🚀 FACTORY PATTERN CONDITIONAL RENDER ENGINE
  switch (selectedMethod.type) {
    case "CREDIT_CARD":
      return (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* SANAL KREDİ KARTI VİSULIZATION (APPLE / STRIPE LEVEL) */}
          <div className="relative w-full max-w-sm mx-auto h-48 sm:h-52 rounded-3xl bg-gradient-to-tr from-gray-900 via-slate-800 to-gray-900 text-white p-6 shadow-2xl overflow-hidden border border-gray-700 flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <span className="text-xs font-black tracking-widest uppercase text-gray-400">VITRIN SECURE CARD</span>
              <span className="text-xl">💳</span>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-gray-400 font-mono tracking-widest block">KART NUMARASI</span>
              <p className="font-mono text-lg sm:text-xl font-bold tracking-widest truncate">
                {cardNumber || "•••• •••• •••• ••••"}
              </p>
            </div>

            <div className="flex justify-between items-end">
              <div>
                <span className="text-[9px] text-gray-400 font-mono tracking-widest block">KART SAHİBİ</span>
                <p className="font-bold text-xs uppercase tracking-wider truncate max-w-[180px]">
                  {cardHolder || "AD SOYAD"}
                </p>
              </div>

              <div>
                <span className="text-[9px] text-gray-400 font-mono tracking-widest block">SON KULLANMA</span>
                <p className="font-mono font-bold text-xs">{expiryDate || "MM/YY"}</p>
              </div>
            </div>
          </div>

          {/* KART FORM INPUTLARI */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-bold text-gray-700 block">Kart Üzerindeki İsim</label>
              <input
                type="text"
                placeholder="Örn: Ahmet Yılmaz"
                value={cardHolder}
                onChange={(e) => setCardHolder(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm font-medium"
              />
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-bold text-gray-700 block">Kart Numarası</label>
              <input
                type="text"
                placeholder="4543 •••• •••• ••••"
                value={cardNumber}
                onChange={handleCardNumberChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm font-mono font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 block">Son Kullanma Tarihi</label>
              <input
                type="text"
                placeholder="MM/YY"
                value={expiryDate}
                onChange={handleExpiryChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm font-mono font-bold text-center"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 block">CVC / CVV</label>
              <input
                type="password"
                maxLength={3}
                placeholder="•••"
                value={cvc}
                onChange={(e) => setCvc(e.target.value.replace(/\D/g, ""))}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm font-mono font-bold text-center"
              />
            </div>
          </div>

          <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-2xl flex items-center gap-2 text-xs text-blue-900 font-medium">
            <span>🛡️</span>
            <span>Ödemeniz <strong>3D Secure 2.0</strong> banka onay şifresi ile gerçekleşecektir.</span>
          </div>

        </div>
      );

    case "BANK_TRANSFER":
      return (
        <div className="space-y-4 animate-in fade-in duration-300 text-left">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 font-medium">
            💡 Siparişiniz oluşturulduktan sonra aşağıdaki IBAN adreslerinden birine ödemeyi gerçekleştirebilirsiniz.
          </div>

          {selectedMethod.bankAccounts && selectedMethod.bankAccounts.length > 0 ? (
            <div className="space-y-3">
              {selectedMethod.bankAccounts.map((bank) => (
                <div key={bank.id} className="p-4 bg-white rounded-2xl border border-gray-200 shadow-2xs space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-black text-gray-900 text-sm">🏦 {bank.bankName}</span>
                    <span className="bg-blue-100 text-blue-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                      {bank.currency}
                    </span>
                  </div>

                  <div className="text-xs space-y-1 text-gray-600">
                    <p><strong>Alıcı Adı:</strong> {bank.accountHolder}</p>
                    <div className="flex items-center justify-between bg-gray-50 p-2 rounded-xl border border-gray-100">
                      <span className="font-mono font-bold text-gray-900">{bank.iban}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(bank.iban, "IBAN Adresi")}
                        className="text-[10px] bg-gray-900 hover:bg-gray-800 text-white font-bold px-2.5 py-1 rounded-lg transition"
                      >
                        Kopyala
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 text-xs font-mono font-bold text-gray-700">
              IBAN: TR98 0006 2000 0000 1234 5678 90 (Garanti BBVA - Vitrin A.Ş.)
            </div>
          )}
        </div>
      );

    case "CASH_ON_DELIVERY":
      return (
        <div className="p-5 bg-white rounded-3xl border border-gray-200 shadow-2xs text-left space-y-3 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <span className="font-black text-gray-900 text-sm">🚚 Kapıda Ödeme Hizmeti</span>
            <span className="bg-orange-100 text-orange-800 text-xs font-extrabold px-3 py-1 rounded-full">
              +{selectedMethod.fee.toLocaleString("tr-TR")} ₺ Hizmet Bedeli
            </span>
          </div>

          <p className="text-xs text-gray-600 font-medium">
            Siparişinizi teslim alırken kargo görevlisine nakit veya kargo pos cihazı üzerinden kredi kartı ile ödeme yapabilirsiniz.
          </p>
        </div>
      );

    case "DIGITAL_WALLET":
      return (
        <div className="p-5 bg-white rounded-3xl border border-gray-200 shadow-2xs text-left space-y-3 animate-in fade-in duration-300">
          <span className="font-black text-gray-900 text-sm block">📱 Dijital Cüzdan & Papara / FAST QR</span>
          <p className="text-xs text-gray-600 font-medium">
            Siparişi onayladıktan sonra ekranınızda beliren QR kodu cüzdan uygulamanızdan okutarak anında ödeme yapabilirsiniz.
          </p>
        </div>
      );

    default:
      return null;
  }
}
