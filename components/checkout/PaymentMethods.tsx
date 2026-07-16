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
    setCvv(e.target.value.replace(/\D/g, "").substring(0, 3));
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
      <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2 border-b pb-4">
        <span className="text-2xl">💳</span> Ödeme Yöntemi
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <label className={`cursor-pointer p-4 rounded-xl border-2 flex items-center justify-center gap-2 font-bold transition-all ${paymentMethod === 'credit_card' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:border-blue-300'}`}>
          <input type="radio" name="payment" value="credit_card" checked={paymentMethod === 'credit_card'} onChange={(e) => setPaymentMethod(e.target.value)} className="hidden" />
          Kredi Kartı
        </label>
        <label className={`cursor-pointer p-4 rounded-xl border-2 flex items-center justify-center gap-2 font-bold transition-all ${paymentMethod === 'havale' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:border-blue-300'}`}>
          <input type="radio" name="payment" value="havale" checked={paymentMethod === 'havale'} onChange={(e) => setPaymentMethod(e.target.value)} className="hidden" />
          Havale / EFT
        </label>
        <label className={`cursor-pointer p-4 rounded-xl border-2 flex items-center justify-center gap-2 font-bold transition-all ${paymentMethod === 'kapida' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:border-blue-300'}`}>
          <input type="radio" name="payment" value="kapida" checked={paymentMethod === 'kapida'} onChange={(e) => setPaymentMethod(e.target.value)} className="hidden" />
          Kapıda Ödeme
        </label>
      </div>

      {paymentMethod === "credit_card" && (
        <div className="space-y-5 animate-in fade-in duration-500">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Kart Üzerindeki İsim</label>
            <input required type="text" placeholder="Örn: SALİH BALTA" className="w-full border border-gray-300 rounded-lg p-3 uppercase focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 hover:bg-white" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 flex justify-between">
              <span>Kart Numarası</span>
              <span className="text-gray-400 text-xs">Visa, Mastercard, Troy, Amex</span>
            </label>
            <div className="relative">
              <input required type="text" value={cardNumber} onChange={handleCardNumberChange} placeholder="XXXX XXXX XXXX XXXX" className="w-full border border-gray-300 rounded-lg p-3 tracking-wider focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 hover:bg-white pr-16" />
              {cardBrand && (
                <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-extrabold px-2 py-1 rounded shadow-sm ${
                  cardBrand === 'VISA' ? 'bg-blue-600 text-white' : 
                  cardBrand === 'MASTERCARD' ? 'bg-orange-500 text-white' : 
                  cardBrand === 'TROY' ? 'bg-teal-600 text-white' : 'bg-blue-400 text-white'
                }`}>{cardBrand}</span>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Son Kullanma (AA/YY)</label>
              <input required type="text" value={expiry} onChange={handleExpiryChange} placeholder="AA/YY" className="w-full border border-gray-300 rounded-lg p-3 text-center focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 hover:bg-white" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">CVV</label>
              <input required type="text" value={cvv} onChange={handleCvvChange} placeholder="123" className="w-full border border-gray-300 rounded-lg p-3 text-center focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 hover:bg-white" />
            </div>
          </div>
        </div>
      )}

      {paymentMethod === "havale" && (
        <div className="p-6 bg-blue-50 rounded-xl border border-blue-100 text-blue-800 animate-in fade-in duration-500">
          <h3 className="font-bold mb-2">Banka Hesap Bilgilerimiz:</h3>
          <p className="text-sm mb-1">Banka: Ziraat Bankası</p>
          <p className="text-sm mb-1">Alıcı: E-Ticaret A.Ş.</p>
          <p className="text-sm font-mono font-bold mt-2">TR99 0001 0000 0000 0000 0000 00</p>
        </div>
      )}

      {paymentMethod === "kapida" && (
        <div className="p-6 bg-orange-50 rounded-xl border border-orange-100 text-orange-800 animate-in fade-in duration-500">
          <h3 className="font-bold mb-2 flex items-center gap-2">⚠️ Önemli Bilgilendirme</h3>
          <p className="text-sm">Kapıda ödeme seçeneğinde kargo firması tarafından tahsilat hizmet bedeli olarak faturanıza <span className="font-bold">29.90 TL</span> eklenecektir.</p>
        </div>
      )}
    </div>
  );
}