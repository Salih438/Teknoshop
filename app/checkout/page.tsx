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

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clearCart } = useCartStore();
  const { isLoaded, isSignedIn } = useAuth(); 
  
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [paymentMethodId, setPaymentMethodId] = useState("");
  
  const [isAgreed, setIsAgreed] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  
  const [userAddresses, setUserAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");

  useEffect(() => {
  // eslint-disable-next-line react-hooks/set-state-in-effect
  setMounted(true);
}, []);

  useEffect(() => {
    if (!isSignedIn) return;

    const fetchCheckoutData = async () => {
      try {
        const [addrRes, payRes] = await Promise.all([
          fetch("/api/addresses"),
          fetch("/api/payment-methods") 
        ]);

        if (addrRes.ok) {
          const data = await addrRes.json();
          setUserAddresses(data.addresses || []);
          if (data.addresses && data.addresses.length > 0) {
            setSelectedAddressId(data.addresses[0].id);
          }
        }

        if (payRes.ok) {
          const data = await payRes.json();
          setPaymentMethods(data.paymentMethods || []);
          if (data.paymentMethods && data.paymentMethods.length > 0) {
            setPaymentMethodId(data.paymentMethods[0].id);
          }
        }
      } catch (error) {
        console.error("Veriler çekilemedi", error);
      }
    };
    
    fetchCheckoutData();
  }, [isSignedIn]);

  const subTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingCost = subTotal > 5000 ? 0 : 149.99;
  
  const selectedPayment = paymentMethods.find(p => p.id === paymentMethodId);
  const paymentFee = selectedPayment?.fee || 0;

  const finalTotal = subTotal + shippingCost + paymentFee - discount;

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
        body: JSON.stringify({ couponCode, subTotal })
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

  // 🚀 YENİ EKLENEN: Kuponu Kaldırma Fonksiyonu
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
          couponCode: discount > 0 ? couponCode : undefined
        })
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
      <div className="max-w-6xl mx-auto py-12 px-4 animate-pulse">
        <div className="h-10 bg-gray-200 rounded w-1/3 mb-8"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-8">
            <div className="h-48 bg-gray-100 rounded-2xl"></div>
            <div className="h-64 bg-gray-100 rounded-2xl"></div>
          </div>
          <div className="h-96 bg-gray-100 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="py-24 text-center px-4 animate-in fade-in">
        <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Güvenli Ödeme İçin Giriş Yapın</h1>
        <p className="text-gray-500 mb-8 max-w-md mx-auto">Siparişinizi tamamlamak ve kargo takibini yapabilmek için lütfen hesabınıza giriş yapın veya kayıt olun.</p>
        <Link href="/" className="inline-block bg-blue-600 text-white font-bold px-8 py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-md">
          Ana Sayfaya Dön
        </Link>
      </div>
    );
  }

  if (items.length === 0 && !isSubmitting) {
    return (
      <div className="py-24 text-center px-4 animate-in fade-in">
        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Sepetiniz Boş</h1>
        <p className="text-gray-500 mb-8">Ödeme adımına geçmek için sepetinize ürün eklemelisiniz.</p>
        <button onClick={() => router.push("/products")} className="bg-gray-900 text-white font-bold px-8 py-3 rounded-xl hover:bg-gray-800 transition-colors shadow-md">
          Ürünlere Göz At
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 animate-in fade-in duration-500">
      
      <div className="mb-8 flex items-center justify-between border-b border-gray-100 pb-6">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Güvenli Ödeme</h1>
        <Link href="/cart" className="flex items-center gap-2 text-gray-600 hover:text-blue-600 font-bold bg-gray-50 hover:bg-blue-50 px-5 py-2.5 rounded-xl transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Sepete Dön
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          <form id="checkout-form" onSubmit={handlePlaceOrder}>
            <AddressSelector 
              addresses={userAddresses} 
              selectedAddressId={selectedAddressId} 
              onSelect={setSelectedAddressId} 
            />
            
            <div className="mt-8">
              <PaymentMethods 
                paymentMethods={paymentMethods}
                paymentMethodId={paymentMethodId} 
                setPaymentMethodId={setPaymentMethodId} 
              />
            </div>
          </form>
        </div>

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
            removeCoupon={removeCoupon} // 🚀 YENİ EKLENEN PROP
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