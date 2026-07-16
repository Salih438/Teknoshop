"use client";

import { useCartStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import toast from "react-hot-toast";

// MODÜLLERİMİZİN İÇE AKTARILMASI (Sıfır Hata İçin Tam Liste)
import AddressSelector from "@/components/checkout/AddressSelector";
import PaymentMethods from "@/components/checkout/PaymentMethods";
import OrderSummary from "@/components/checkout/OrderSummary";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clearCart } = useCartStore();
  
  // --- ORTAK DURUM (STATE) YÖNETİMİ ---
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("credit_card");
  const [isAgreed, setIsAgreed] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  
  // Veritabanından çekilecek adresler için state'lerimiz
  const [userAddresses, setUserAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");

  // Sayfa yüklendiğinde kullanıcının kayıtlı adreslerini API'den çekiyoruz
  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const res = await fetch("/api/addresses");
        if (res.ok) {
          const data = await res.json();
          setUserAddresses(data.addresses || []);
        }
      } catch (error) {
        console.error("Adresler çekilemedi", error);
      }
    };
    fetchAddresses();
  }, []);

  // --- HESAPLAMALAR ---
  const subTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingCost = subTotal > 5000 ? 0 : 149.99; // 5000 TL üzerine kargo bedava
  const finalTotal = subTotal + shippingCost - discount;

  // --- KUPON UYGULAMA ---
  const applyCoupon = () => {
    if (couponCode.toUpperCase() === "YAZ2026") {
      setDiscount(subTotal * 0.1); // %10 İndirim
      toast.success("Kupon başarıyla uygulandı! %10 İndirim kazandınız.");
    } else {
      toast.error("Geçersiz veya süresi dolmuş kupon kodu.");
      setDiscount(0);
    }
  };

  // --- SİPARİŞİ TAMAMLAMA (API İSTEĞİ) ---
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault(); 
    
    if (!selectedAddressId) {
      toast.error("Lütfen bir teslimat adresi seçiniz.");
      return;
    }
    if (!isAgreed) {
      toast.error("Lütfen mesafeli satış sözleşmesini onaylayınız.");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Siparişiniz oluşturuluyor...");

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          addressId: selectedAddressId,
          paymentMethod: paymentMethod,
          items: items,
          totalPrice: finalTotal
        })
      });

      if (response.ok) {
        toast.success("Sipariş başarıyla alındı!", { id: toastId });
        clearCart(); 
        router.push("/order-success"); 
      } else {
        toast.error("Sipariş oluşturulamadı.", { id: toastId });
        setIsSubmitting(false);
      }
    } catch (error) {
      toast.error("Sunucuya bağlanılamadı.", { id: toastId });
      setIsSubmitting(false);
    }
  };

  // Sepet Boş Ekranı
  if (items.length === 0 && !isSubmitting) {
    return (
      <div className="py-20 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Sepetiniz Boş</h1>
        <button onClick={() => router.push("/products")} className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700">
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
        <Link href="/cart" className="flex items-center gap-2 text-gray-600 hover:text-blue-600 font-semibold bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Sepete Dön
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* SOL TARAF: FORM VE ALT MODÜLLER (Adres & Ödeme Yöntemi) */}
        <div className="lg:col-span-2 space-y-8">
          <form id="checkout-form" onSubmit={handlePlaceOrder}>
            
            {/* 1. Modül: Adres Seçici */}
            <AddressSelector 
              addresses={userAddresses} 
              selectedAddressId={selectedAddressId} 
              onSelect={setSelectedAddressId} 
            />
            
            {/* 2. Modül: Ödeme Seçenekleri ve Formları */}
            <PaymentMethods 
              paymentMethod={paymentMethod} 
              setPaymentMethod={setPaymentMethod} 
            />

          </form>
        </div>

        {/* SAĞ TARAF: SİPARİŞ ÖZETİ MODÜLÜ */}
        <div className="lg:col-span-1">
          <OrderSummary 
            items={items}
            subTotal={subTotal}
            shippingCost={shippingCost}
            discount={discount}
            finalTotal={finalTotal}
            couponCode={couponCode}
            setCouponCode={setCouponCode}
            applyCoupon={applyCoupon}
            isAgreed={isAgreed}
            setIsAgreed={setIsAgreed}
            isSubmitting={isSubmitting}
            selectedAddressId={selectedAddressId}
          />
        </div>

      </div>
    </div>
  );
}