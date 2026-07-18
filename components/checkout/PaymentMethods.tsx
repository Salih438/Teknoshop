"use client";

import { useState } from "react";

export default function PaymentMethods({ 
  paymentMethod, 
  setPaymentMethod 
}: { 
  paymentMethod: string, 
  setPaymentMethod: (method: string) => void 
}) {
  
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");

  const getCardBrand = (num: string) => {
    const clean = num.replace(/\D/g, "");
    if (clean.startsWith("4")) return "VISA";
    if (/^5[1-5]/.test(clean) || /^2[2-7]/.test(clean)) return "MASTERCARD";
    if (/^3[47]/.test(clean)) return "AMEX";
    if (/^9792/.test(clean)) return "TROY";
    return "";
  };
  const cardBrand = getCardBrand(cardNumber);

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ""); 
    const formattedValue = value.replace(/(\d{4})/g, "$1 ").trim(); 
    setCardNumber(formattedValue.substring(0, 19)); 
  };
  
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 2) value = value.substring(0, 2) + "/" + value.substring(2, 4);
    setExpiry(value.substring(0, 5));
  };
  
  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 🚀 AMEX DÜZELTMESİ: AMEX kartların güvenlik kodu 4 hanelidir
    const maxLength = cardBrand === "AMEX" ? 4 : 3;
    setCvv(e.target.value.replace(/\D/g, "").substring(0, maxLength));
  };

  return (
    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
      <h2 className="text-xl font-extrabold text-gray-900 mb-6 flex items-center gap-3 border-b border-gray-100 pb-4">
        <span className="bg-blue-50 text-blue-600 p-2 rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        </span>
        Ödeme Yöntemi
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <label className={`cursor-pointer p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 font-bold transition-all ${paymentMethod === 'credit_card' ? 'border-blue-600 bg-blue-50/50 text-blue-700 shadow-sm transform scale-[1.02]' : 'border-gray-200 text-gray-500 hover:border-blue-300 hover:bg-gray-50'}`}>
          <input type="radio" name="payment" value="credit_card" checked={paymentMethod === 'credit_card'} onChange={(e) => setPaymentMethod(e.target.value)} className="hidden" />
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
          Kredi Kartı
        </label>
        <label className={`cursor-pointer p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 font-bold transition-all ${paymentMethod === 'havale' ? 'border-blue-600 bg-blue-50/50 text-blue-700 shadow-sm transform scale-[1.02]' : 'border-gray-200 text-gray-500 hover:border-blue-300 hover:bg-gray-50'}`}>
          <input type="radio" name="payment" value="havale" checked={paymentMethod === 'havale'} onChange={(e) => setPaymentMethod(e.target.value)} className="hidden" />
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" /></svg>
          Havale / EFT
        </label>
        <label className={`cursor-pointer p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 font-bold transition-all ${paymentMethod === 'kapida' ? 'border-blue-600 bg-blue-50/50 text-blue-700 shadow-sm transform scale-[1.02]' : 'border-gray-200 text-gray-500 hover:border-blue-300 hover:bg-gray-50'}`}>
          <input type="radio" name="payment" value="kapida" checked={paymentMethod === 'kapida'} onChange={(e) => setPaymentMethod(e.target.value)} className="hidden" />
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
          Kapıda Ödeme
        </label>
      </div>

      {paymentMethod === "credit_card" && (
        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Kart Üzerindeki İsim</label>
            <input 
              required 
              type="text" 
              autoComplete="cc-name"
              placeholder="Örn: SALİH BALTA" 
              className="w-full border border-gray-300 rounded-xl p-3 uppercase focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 hover:bg-white transition-colors shadow-sm" 
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 flex justify-between">
              <span>Kart Numarası</span>
              <span className="text-gray-400 text-xs font-medium tracking-wider">VISA, MC, TROY, AMEX</span>
            </label>
            <div className="relative">
              <input 
                required 
                type="text" 
                inputMode="numeric"
                autoComplete="cc-number"
                value={cardNumber} 
                onChange={handleCardNumberChange} 
                placeholder="XXXX XXXX XXXX XXXX" 
                className="w-full border border-gray-300 rounded-xl p-3 tracking-widest font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 hover:bg-white pr-16 transition-colors shadow-sm" 
              />
              {cardBrand && (
                <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-[10px] tracking-wider font-extrabold px-2.5 py-1.5 rounded-md shadow-sm animate-in zoom-in ${
                  cardBrand === 'VISA' ? 'bg-[#1434CB] text-white' : 
                  cardBrand === 'MASTERCARD' ? 'bg-[#FF5F00] text-white' : 
                  cardBrand === 'TROY' ? 'bg-[#00A99D] text-white' : 'bg-gray-800 text-white'
                }`}>{cardBrand}</span>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Son Kullanma (AA/YY)</label>
              <input 
                required 
                type="text" 
                inputMode="numeric"
                autoComplete="cc-exp"
                value={expiry} 
                onChange={handleExpiryChange} 
                placeholder="AA/YY" 
                className="w-full border border-gray-300 rounded-xl p-3 text-center font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 hover:bg-white transition-colors shadow-sm" 
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex justify-between">
                <span>CVV</span>
                <span className="text-gray-400 text-xs font-medium cursor-help" title="Kartınızın arkasındaki 3 haneli güvenlik kodu. Amex için ön yüzdeki 4 haneli kod.">?</span>
              </label>
              <input 
                required 
                type="text" 
                inputMode="numeric"
                autoComplete="cc-csc"
                value={cvv} 
                onChange={handleCvvChange} 
                placeholder={cardBrand === "AMEX" ? "1234" : "123"} 
                className="w-full border border-gray-300 rounded-xl p-3 text-center font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 hover:bg-white transition-colors shadow-sm" 
              />
            </div>
          </div>
        </div>
      )}

      {paymentMethod === "havale" && (
        <div className="p-6 bg-blue-50 rounded-xl border border-blue-100 text-blue-900 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="flex items-start gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <div>
              <h3 className="font-extrabold mb-3 text-blue-800">Banka Hesap Bilgilerimiz</h3>
              <div className="space-y-2">
                <div className="flex justify-between border-b border-blue-200/50 pb-2">
                  <span className="text-sm font-medium text-blue-700">Banka</span>
                  <span className="text-sm font-bold">Ziraat Bankası</span>
                </div>
                <div className="flex justify-between border-b border-blue-200/50 pb-2">
                  <span className="text-sm font-medium text-blue-700">Alıcı Adı</span>
                  <span className="text-sm font-bold">Vitrin Teknoloji A.Ş.</span>
                </div>
                <div className="flex flex-col mt-3">
                  <span className="text-sm font-medium text-blue-700 mb-1">IBAN Numarası</span>
                  <span className="text-base font-mono font-extrabold bg-white px-3 py-2 rounded-lg border border-blue-200 text-center tracking-wider">TR99 0001 0000 0000 0000 0000 00</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {paymentMethod === "kapida" && (
        <div className="p-6 bg-orange-50 rounded-xl border border-orange-200 text-orange-900 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="flex items-start gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            <div>
              <h3 className="font-extrabold mb-1">Önemli Bilgilendirme</h3>
              <p className="text-sm leading-relaxed">
                Kapıda ödeme seçeneğinde, kargo firması tarafından tahsilat hizmet bedeli olarak sipariş tutarınıza ek <span className="font-bold text-orange-700 bg-orange-100 px-1.5 py-0.5 rounded">29.90 TL</span> yansıtılacaktır. Ödemeyi kapıda nakit veya kredi kartı ile yapabilirsiniz.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}