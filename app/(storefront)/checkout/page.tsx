"use client";

import { useCartStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import toast from "react-hot-toast";

import type { Address, PaymentMethod } from "@prisma/client";

import AddressSelector from "@/components/checkout/AddressSelector";
import PaymentMethods from "@/components/checkout/PaymentMethods";
import OrderSummary from "@/components/checkout/OrderSummary";
import DeliverySelector, { DeliveryOption } from "@/components/checkout/DeliverySelector";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clearCart } = useCartStore();
  const { isLoaded, isSignedIn } = useAuth();

  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [creditCardData, setCreditCardData] = useState({
    cardNumber: "",
    cardHolder: "",
    expiryDate: "",
    cvc: "",
  });

  const [isAgreed, setIsAgreed] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);

  const [userAddresses, setUserAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [storeSettings, setStoreSettings] = useState<{ shippingFee: number; freeShippingThreshold: number } | null>(null);

  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryOption | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isSignedIn) return;

    const fetchCheckoutData = async () => {
      try {
        const [addrRes, payRes, settingsRes] = await Promise.all([
          fetch("/api/addresses"),
          fetch("/api/payment-methods"),
          fetch("/api/settings"),
        ]);

        if (addrRes.ok) {
          const data = await addrRes.json();
          setUserAddresses(data.addresses || []);
          if (data.addresses && data.addresses.length > 0) {
            const defaultAddr = data.addresses.find((a: Address) => a.isDefault);
            setSelectedAddressId(defaultAddr ? defaultAddr.id : data.addresses[0].id);
          }
        }

        if (payRes.ok) {
          const data = await payRes.json();
          setPaymentMethods(data.paymentMethods || []);
          if (data.paymentMethods && data.paymentMethods.length > 0) {
            setPaymentMethodId(data.paymentMethods[0].id);
          }
        }

        if (settingsRes.ok) {
          const settings = await settingsRes.json();
          setStoreSettings(settings);
        }
      } catch (error) {
        console.error("Veriler çekilemedi", error);
      }
    };

    fetchCheckoutData();
  }, [isSignedIn]);

  const subTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountedSubTotal = Math.max(0, subTotal - discount);

  const defaultFee = storeSettings?.shippingFee ?? 149.99;
  const threshold = storeSettings?.freeShippingThreshold ?? 5000.0;
  const isFreeShipping = discountedSubTotal >= threshold;

  const deliveryCost = selectedDelivery ? selectedDelivery.fee : (isFreeShipping ? 0 : defaultFee);

  const selectedPayment = paymentMethods.find((p) => p.id === paymentMethodId);
  const paymentFee = selectedPayment?.fee || 0;

  const finalTotal = Math.max(0, discountedSubTotal + deliveryCost + paymentFee);

  const applyCoupon = async () => {
    if (!couponCode) {
      toast.error("Lütfen bir kupon kodu giriniz.");
      return;
    }

    const toastId = toast.loading("Kupon doğrulanıyor...");

    try {
      const response = await fetch("/api/checkout/validate-coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ couponCode, subTotal }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setDiscount(data.discount);
        toast.success(data.message || "Kupon başarıyla uygulandı!", { id: toastId });
      } else {
        toast.error(data.error || "Geçersiz veya süresi dolmuş kupon kodu.", { id: toastId });
        setDiscount(0);
      }
    } catch {
      toast.error("Sunucuya bağlanılamadı.", { id: toastId });
      setDiscount(0);
    }
  };

  const removeCoupon = () => {
    setCouponCode("");
    setDiscount(0);
    toast.success("Kupon başarıyla kaldırıldı.");
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAddressId) {
      toast.error("Lütfen bir teslimat adresi seçiniz.");
      return;
    }
    if (!paymentMethodId) {
      toast.error("Lütfen bir ödeme yöntemi seçiniz.");
      return;
    }
    if (!isAgreed) {
      toast.error("Lütfen mesafeli satış sözleşmesini onaylayınız.");
      return;
    }

    const selectedMethod = paymentMethods.find((p) => p.id === paymentMethodId);
    if (selectedMethod?.type === "CREDIT_CARD") {
      if (!creditCardData.cardHolder.trim()) {
        toast.error("Lütfen kart üzerindeki ismi giriniz.");
        document.getElementById("card-holder")?.focus();
        return;
      }
      const rawCardNum = creditCardData.cardNumber.replace(/\D/g, "");
      if (!rawCardNum || rawCardNum.length !== 16) {
        toast.error("Lütfen 16 haneli geçerli bir kart numarası giriniz.");
        document.getElementById("card-number")?.focus();
        return;
      }
      if (!creditCardData.expiryDate.trim() || !/^\d{2}\/\d{2}$/.test(creditCardData.expiryDate)) {
        toast.error("Son kullanma tarihi MM/YY formatında olmalıdır.");
        document.getElementById("card-expiry")?.focus();
        return;
      }
      const month = parseInt(creditCardData.expiryDate.slice(0, 2), 10);
      if (month < 1 || month > 12) {
        toast.error("Geçersiz ay bilgisi (01-12 arasında olmalıdır).");
        document.getElementById("card-expiry")?.focus();
        return;
      }
      if (!creditCardData.cvc.trim() || !/^\d{3}$/.test(creditCardData.cvc)) {
        toast.error("Lütfen 3 haneli CVC kodunu giriniz.");
        document.getElementById("card-cvc")?.focus();
        return;
      }
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Siparişiniz güvenli bir şekilde oluşturuluyor...");

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          addressId: selectedAddressId,
          paymentMethodId: paymentMethodId,
          items: items,
          couponCode: discount > 0 ? couponCode : undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Sipariş başarıyla alındı!", { id: toastId });
        clearCart();
        router.push(`/order-success?orderId=${data.orderId}`);
      } else {
        toast.error(data.error || "Sipariş oluşturulamadı. Lütfen tekrar deneyin.", { id: toastId });
        setIsSubmitting(false);
      }
    } catch {
      toast.error("Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edin.", { id: toastId });
      setIsSubmitting(false);
    }
  };

  if (!mounted || !isLoaded) {
    return (
      <div className="max-w-6xl mx-auto py-8 px-4 animate-pulse w-full">
        <div className="h-10 bg-gray-200 rounded-xl w-1/3 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-48 bg-gray-100 rounded-3xl" />
            <div className="h-64 bg-gray-100 rounded-3xl" />
          </div>
          <div className="h-96 bg-gray-100 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="py-20 text-center px-4 animate-in fade-in max-w-md mx-auto space-y-4">
        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto text-3xl">
          🔒
        </div>
        <h1 className="text-2xl font-black text-gray-900">Güvenli Ödeme İçin Giriş Yapın</h1>
        <p className="text-gray-500 text-xs sm:text-sm">
          Siparişinizi tamamlamak ve kargo takibini yapabilmek için lütfen hesabınıza giriş yapın.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center bg-blue-600 text-white font-extrabold px-6 py-3.5 rounded-2xl hover:bg-blue-700 transition shadow-md text-sm min-h-[44px]"
        >
          Ana Sayfaya Dön
        </Link>
      </div>
    );
  }

  if (items.length === 0 && !isSubmitting) {
    return (
      <div className="py-20 text-center px-4 animate-in fade-in max-w-md mx-auto space-y-4">
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-3xl">
          📦
        </div>
        <h1 className="text-2xl font-black text-gray-900">Sepetiniz Boş</h1>
        <p className="text-gray-500 text-xs sm:text-sm">Ödeme adımına geçmek için sepetinize ürün eklemelisiniz.</p>
        <button
          onClick={() => router.push("/products")}
          className="bg-gray-900 text-white font-extrabold px-6 py-3.5 rounded-2xl hover:bg-gray-800 transition shadow-md text-sm min-h-[44px]"
        >
          Ürünlere Göz At
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-6 sm:py-8 px-4 pb-28 lg:pb-8 animate-in fade-in duration-500 w-full overflow-x-clip text-left">
      
      {/* ÜST BAŞLIK VE SEPETE DÖN LİNKİ */}
      <div className="mb-6 border-b border-gray-100 pb-4 flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
          Güvenli Ödeme & Teslimat
        </h1>
        <Link
          href="/cart"
          className="text-xs sm:text-sm text-gray-600 hover:text-blue-600 font-extrabold bg-gray-100 hover:bg-blue-50 px-3.5 py-2 rounded-xl transition min-h-[40px] flex items-center gap-1.5"
        >
          ← Sepete Dön
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-10">
        
        {/* SOL: ADRES, TESLİMAT VE ÖDEME FORM ALANI */}
        <div className="lg:col-span-2 space-y-6">
          <form id="checkout-form" onSubmit={handlePlaceOrder}>
            
            {/* 1. ADRES SEÇİCİ */}
            <AddressSelector
              addresses={userAddresses}
              selectedAddressId={selectedAddressId}
              onSelect={setSelectedAddressId}
            />

            {/* 2. TESLİMAT YÖNTEMİ SEÇİCİ */}
            <DeliverySelector
              onSelectDelivery={(opt) => setSelectedDelivery(opt)}
              isFreeShipping={isFreeShipping}
            />

            {/* 3. DINAMİK ÖDEME YÖNTEMLERİ SEÇİCİ (P4.5 ENGINE) */}
            <PaymentMethods
              paymentMethods={paymentMethods}
              paymentMethodId={paymentMethodId}
              setPaymentMethodId={setPaymentMethodId}
              onCardDataChange={setCreditCardData}
            />

          </form>
        </div>

        {/* SAĞ: SİPARİŞ ÖZETİ (STICKY PANEL) */}
        <div className="lg:col-span-1">
          <OrderSummary
            items={items}
            subTotal={subTotal}
            shippingCost={deliveryCost}
            discount={discount}
            finalTotal={finalTotal}
            couponCode={couponCode}
            setCouponCode={setCouponCode}
            applyCoupon={applyCoupon}
            removeCoupon={removeCoupon}
            isAgreed={isAgreed}
            setIsAgreed={setIsAgreed}
            isSubmitting={isSubmitting}
            selectedAddressId={selectedAddressId}
            paymentMethodId={paymentMethodId}
          />
        </div>

      </div>

      {/* 🚀 MOBİL STICKY BOTTOM CTA BAR */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 p-3 shadow-2xl flex items-center justify-between gap-3 animate-in slide-in-from-bottom duration-300">
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Genel Toplam</span>
          <span className="text-xl font-black text-blue-600 leading-tight truncate">
            {finalTotal.toLocaleString("tr-TR")} ₺
          </span>
        </div>

        <button
          type="submit"
          form="checkout-form"
          disabled={isSubmitting || !isAgreed || !selectedAddressId || !paymentMethodId}
          className={`flex-1 flex items-center justify-center text-white font-extrabold text-xs sm:text-sm py-3.5 px-4 rounded-2xl transition-all shadow-md min-h-[44px] ${
            isSubmitting || !isAgreed || !selectedAddressId || !paymentMethodId
              ? "bg-gray-300 text-gray-500 cursor-not-allowed shadow-none"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {isSubmitting ? "İşleniyor..." : "Siparişi Tamamla ➔"}
        </button>
      </div>

    </div>
  );
}