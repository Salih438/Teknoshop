"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { cancelOrderAction } from "@/actions/order";

interface CancelOrderModalProps {
  orderId: string;
}

export default function CancelOrderModal({ orderId }: CancelOrderModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleCancel = async () => {
    setIsLoading(true);
    const result = await cancelOrderAction(orderId);
    setIsLoading(false);

    if (result.success) {
      toast.success("Siparişiniz başarıyla iptal edildi ve stok iadesi yapıldı. 🛑");
      setIsOpen(false);
    } else {
      toast.error(result.error || "Sipariş iptal edilirken bir hata oluştu.");
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-extrabold px-4 py-2.5 rounded-xl text-xs sm:text-sm transition min-h-[44px] inline-flex items-center gap-1.5 shadow-xs"
      >
        <span>🚫</span> Siparişi İptal Et
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-gray-100 relative text-center space-y-4">
            
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto text-3xl">
              ⚠️
            </div>

            <h3 className="text-lg sm:text-xl font-black text-gray-900">
              Siparişi İptal Etmek İstiyor musunuz?
            </h3>

            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              <span className="font-bold font-mono">#{orderId.slice(-8).toUpperCase()}</span> numaralı siparişiniz iptal edilecek ve sepetteki tüm ürünlerin stokları mağazaya geri aktarılacaktır. Bu işlem geri alınamaz.
            </p>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setIsOpen(false)}
                disabled={isLoading}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-extrabold py-3 rounded-xl text-xs sm:text-sm transition min-h-[44px]"
              >
                Vazgeç
              </button>
              <button
                onClick={handleCancel}
                disabled={isLoading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-extrabold py-3 rounded-xl text-xs sm:text-sm transition shadow-sm min-h-[44px] flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? "İptal Ediliyor..." : "Evet, İptal Et"}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
