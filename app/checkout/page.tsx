"use client";

import { useCartStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clearCart } = useCartStore();
  
  // --- STATE (HAFIZA) YÖNETİMİ ---
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("credit_card"); // credit_card, havale, kapida
  const [isAgreed, setIsAgreed] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);

  // Kart Formatlamaları
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");

  // --- HESAPLAMALAR ---
  const subTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingCost = subTotal > 5000 ? 0 : 149.99; // 5000 TL üzerine kargo bedava
  const finalTotal = subTotal + shippingCost - discount;

  // --- FONKSİYONLAR ---
  const applyCoupon = () => {
    if (couponCode.toUpperCase() === "YAZ2026") {
      setDiscount(subTotal * 0.1); // %10 İndirim
      alert("Kupon başarıyla uygulandı! %10 İndirim kazandınız.");
    } else {
      alert("Geçersiz veya süresi dolmuş kupon kodu.");
      setDiscount(0);
    }
  };

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

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault(); 
    
    if (paymentMethod === "credit_card" && (cardNumber.length < 19 || expiry.length < 5 || cvv.length < 3)) {
      alert("Lütfen kredi kartı bilgilerinizi eksiksiz giriniz.");
      return;
    }

    if (!isAgreed) {
      alert("Lütfen mesafeli satış sözleşmesini onaylayınız.");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      clearCart(); 
      router.push("/order-success"); 
    }, 1500);
  };

  // Sepet Boş Ekranı
  if (items.length === 0 && !isSubmitting) {
    return (
      <div className="py-20 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Sepetiniz Boş</h1>
        <button onClick={() => router.push("/products")} className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors">
          Ürünlere Dön
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      
      {/* ÜST BİLGİ VE GERİ DÖN BUTONU */}
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-extrabold text-gray-900">Güvenli Ödeme</h1>
        <Link href="/cart" className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition font-semibold bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Sepete Dön
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* SOL TARAF: FORMLAR */}
        <div className="lg:col-span-2 space-y-8">
          <form id="checkout-form" onSubmit={handlePlaceOrder} className="space-y-8">
            
            {/* 1. BÖLÜM: TESLİMAT BİLGİLERİ */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2 border-b pb-4">
                <span className="text-2xl">👤</span> Müşteri ve İletişim Bilgileri
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Ad Soyad</label>
                  <input required type="text" placeholder="Örn: Salih Balta" className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none transition bg-gray-50 hover:bg-white" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Telefon</label>
                  <input required type="tel" placeholder="0 (5XX) XXX XX XX" className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none transition bg-gray-50 hover:bg-white" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">E-Posta</label>
                  <input required type="email" placeholder="ornek@posta.com" className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none transition bg-gray-50 hover:bg-white" />
                </div>
              </div>

              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2 border-b pb-4 mt-8">
                <span className="text-2xl">📍</span> Teslimat Adresi
              </h2>
              <div className="grid grid-cols-2 gap-5 mb-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">İl</label>
                  <input required type="text" placeholder="Örn: Trabzon" className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none transition bg-gray-50 hover:bg-white" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">İlçe</label>
                  <input required type="text" placeholder="Örn: Ortahisar" className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none transition bg-gray-50 hover:bg-white" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Açık Adres</label>
                <textarea required placeholder="Mahalle, sokak, bina ve daire numaranızı giriniz..." rows={3} className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none transition bg-gray-50 hover:bg-white"></textarea>
              </div>
            </div>

            {/* 2. BÖLÜM: ÖDEME YÖNTEMLERİ */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2 border-b pb-4">
                <span className="text-2xl">💳</span> Ödeme Yöntemi
              </h2>
              
              {/* Yöntem Seçici */}
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

              {/* Kredi Kartı Formu */}
              {paymentMethod === "credit_card" && (
                <div className="space-y-5 animate-in fade-in slide-in-from-top-4 duration-500">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Kart Üzerindeki İsim</label>
                    <input required type="text" placeholder="Örn: SALİH BALTA" className="w-full border border-gray-300 rounded-lg p-3 uppercase focus:ring-2 focus:ring-blue-500 focus:outline-none transition bg-gray-50 hover:bg-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 flex justify-between">
                      <span>Kart Numarası</span>
                      <span className="text-gray-400 text-xs">Visa, Mastercard, Troy, Amex</span>
                    </label>
                    <div className="relative">
                      <input required type="text" value={cardNumber} onChange={handleCardNumberChange} placeholder="XXXX XXXX XXXX XXXX" className="w-full border border-gray-300 rounded-lg p-3 tracking-wider focus:ring-2 focus:ring-blue-500 focus:outline-none transition bg-gray-50 hover:bg-white pr-16" />
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
                      <label className="block text-sm font-bold text-gray-700 mb-2">Son Kullanma Tarihi</label>
                      <input required type="text" value={expiry} onChange={handleExpiryChange} placeholder="AA/YY" className="w-full border border-gray-300 rounded-lg p-3 text-center focus:ring-2 focus:ring-blue-500 focus:outline-none transition bg-gray-50 hover:bg-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">CVV</label>
                      <input required type="text" value={cvv} onChange={handleCvvChange} placeholder="123" className="w-full border border-gray-300 rounded-lg p-3 text-center focus:ring-2 focus:ring-blue-500 focus:outline-none transition bg-gray-50 hover:bg-white" />
                    </div>
                  </div>
                </div>
              )}

              {/* Havale Bilgisi */}
              {paymentMethod === "havale" && (
                <div className="p-6 bg-blue-50 rounded-xl border border-blue-100 text-blue-800 animate-in fade-in duration-500">
                  <h3 className="font-bold mb-2">Banka Hesap Bilgilerimiz:</h3>
                  <p className="text-sm mb-1">Banka: Ziraat Bankası</p>
                  <p className="text-sm mb-1">Alıcı: E-Ticaret A.Ş.</p>
                  <p className="text-sm font-mono font-bold mt-2">TR99 0001 0000 0000 0000 0000 00</p>
                  <p className="text-xs mt-4 text-blue-600">* Lütfen açıklama kısmına sipariş numaranızı yazmayı unutmayın.</p>
                </div>
              )}

              {/* Kapıda Ödeme Bilgisi */}
              {paymentMethod === "kapida" && (
                <div className="p-6 bg-orange-50 rounded-xl border border-orange-100 text-orange-800 animate-in fade-in duration-500">
                  <h3 className="font-bold mb-2 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                    Önemli Bilgilendirme
                  </h3>
                  <p className="text-sm">Kapıda ödeme seçeneğinde kargo firması tarafından tahsilat hizmet bedeli olarak faturanıza <span className="font-bold">29.90 TL</span> eklenecektir. Teslimat sırasında nakit veya kredi kartı ile ödeme yapabilirsiniz.</p>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* SAĞ TARAF: SİPARİŞ ÖZETİ VE ONAY */}
        <div className="lg:col-span-1">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 sticky top-24">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2 border-b pb-4">
              <span className="text-2xl">📦</span> Sipariş Özeti
            </h2>
            
            {/* Ürün Listesi */}
            <div className="space-y-4 mb-6 border-b border-gray-100 pb-6 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between items-start text-sm">
                  <span className="text-gray-700 font-medium max-w-[180px] leading-snug">
                    {item.name} <span className="text-gray-400 block mt-1">Adet: {item.quantity}</span>
                  </span>
                  <span className="font-bold text-gray-900 whitespace-nowrap">{(item.price * item.quantity).toLocaleString('tr-TR')} TL</span>
                </div>
              ))}
            </div>

            {/* Kupon Kodu Alanı */}
            <div className="mb-6 flex gap-2">
              <input 
                type="text" 
                value={couponCode} 
                onChange={(e) => setCouponCode(e.target.value)} 
                placeholder="Kupon Kodu (Örn: YAZ2026)" 
                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none uppercase" 
              />
              <button type="button" onClick={applyCoupon} className="bg-gray-900 text-white px-4 rounded-lg text-sm font-bold hover:bg-blue-600 transition">Uygula</button>
            </div>
            
            {/* Fiyat Dağılımı */}
            <div className="space-y-3 mb-6 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Ara Toplam</span>
                <span className="font-bold text-gray-900">{subTotal.toLocaleString('tr-TR')} TL</span>
              </div>
              
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>İndirim (%10)</span>
                  <span className="font-bold">-{discount.toLocaleString('tr-TR')} TL</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Kargo</span>
                {shippingCost === 0 ? (
                  <span className="text-green-600 font-bold">Ücretsiz</span>
                ) : (
                  <span className="font-bold text-gray-900">{shippingCost.toLocaleString('tr-TR')} TL</span>
                )}
              </div>
            </div>
            
            {/* Genel Toplam */}
            <div className="flex justify-between items-center font-extrabold text-2xl mt-4 pt-6 border-t border-gray-200 mb-8">
              <span className="text-black">Toplam</span>
              <span className="text-blue-600">{finalTotal.toLocaleString('tr-TR')} TL</span>
            </div>

            {/* Sözleşme Onayı */}
            <label className="flex items-start gap-3 cursor-pointer mb-6 group">
              <div className="relative flex items-center mt-1">
                <input type="checkbox" checked={isAgreed} onChange={(e) => setIsAgreed(e.target.checked)} className="w-5 h-5 border-2 border-gray-300 rounded text-blue-600 focus:ring-blue-500 transition cursor-pointer" />
              </div>
              <span className="text-sm text-gray-600 select-none group-hover:text-gray-900 transition">
                <Link href="#" className="text-blue-600 font-bold hover:underline">Ön Bilgilendirme Koşulları</Link>'nı ve <Link href="#" className="text-blue-600 font-bold hover:underline">Mesafeli Satış Sözleşmesi</Link>'ni okudum, onaylıyorum.
              </span>
            </label>

            {/* Siparişi Tamamla Butonu (Forma Bağlı) */}
            <button 
              type="submit" 
              form="checkout-form"
              disabled={isSubmitting || !isAgreed}
              className={`w-full font-bold text-lg py-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 ${
                isSubmitting || !isAgreed ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg transform hover:-translate-y-0.5"
              }`}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  İşleniyor...
                </>
              ) : "Siparişi Tamamla"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}