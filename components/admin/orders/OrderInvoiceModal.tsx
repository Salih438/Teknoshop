"use client";

import { useState, useEffect } from "react";

interface OrderInvoiceModalProps {
  orderId: string;
  customerName: string;
  customerEmail: string;
  totalPrice: number;
  createdAt: string;
  status: string;
}

interface StoreSettingsData {
  phone?: string | null;
  email?: string | null;
  address?: string | null;
}

export default function OrderInvoiceModal({
  orderId,
  customerName,
  customerEmail,
  totalPrice,
  createdAt,
  status,
}: OrderInvoiceModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [storeSettings, setStoreSettings] = useState<StoreSettingsData | null>(null);

  useEffect(() => {
    if (isOpen && !storeSettings) {
      fetch("/api/settings")
        .then((res) => res.json())
        .then((data) => {
          if (data && !data.error) {
            setStoreSettings(data);
          }
        })
        .catch(() => {});
    }
  }, [isOpen, storeSettings]);

  const subTotal = Math.round(totalPrice / 1.2);
  const kdvAmount = totalPrice - subTotal;
  const formattedInvoiceNo = `FAT-${orderId.slice(-8).toUpperCase()}`;

  const storeName = process.env.NEXT_PUBLIC_STORE_NAME || "TEKNOSHOP TEKNOLOJİ A.Ş.";
  const storeAddress = storeSettings?.address || "Maslak Mah. Büyükdere Cad. No:123 Sarıyer / İstanbul";
  const storePhone = storeSettings?.phone || "0850 123 45 67";
  const storeEmail = storeSettings?.email || "fatura@teknoshop.com";

  const handlePrintInvoice = () => {
    window.open(`/api/orders/${orderId}/invoice`, "_blank");
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition min-h-[40px] flex items-center gap-1.5 font-extrabold text-xs cursor-pointer shadow-xs"
        title="Faturayı Gör / Yazdır"
      >
        <span>📄</span>
        <span>E-Fatura</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md text-left animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-100 p-6 sm:p-8 relative">
            
            {/* MODAL ÜST HEADER (FIXED IN FLEX) */}
            <div className="flex justify-between items-center border-b border-gray-100 pb-4 shrink-0 no-print">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-xl font-bold">
                  📄
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-gray-900">E-Fatura Önizleme</h3>
                  <p className="text-xs text-gray-500 font-mono">Fatura No: {formattedInvoiceNo}</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full flex items-center justify-center font-bold transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* CUSTOMER INVOICE AREA (SCROLLABLE IN FLEX) */}
            <div className="flex-1 overflow-y-auto my-4 pr-1 space-y-6 custom-scrollbar bg-gray-50 p-6 rounded-2xl border border-gray-200 text-xs sm:text-sm font-sans">
              
              {/* MAĞAZA VE FATURA HEADER */}
              <div className="flex justify-between items-start border-b border-gray-200 pb-4">
                <div>
                  <h4 className="font-black text-lg text-gray-900 tracking-tight">{storeName}</h4>
                  <p className="text-gray-500 text-xs mt-1">{storeAddress}</p>
                  <p className="text-gray-500 text-xs font-mono">Tel: {storePhone} • E-Posta: {storeEmail}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider border border-green-200 inline-block">
                    E-ARŞİV FATURA
                  </span>
                  <p className="text-[11px] text-gray-400 font-mono mt-2">{formattedInvoiceNo}</p>
                </div>
              </div>

              {/* MÜŞTERİ & FATURA TARİHİ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block mb-0.5">
                    SAYIN / MÜŞTERİ BİLGİSİ
                  </span>
                  <p className="font-extrabold text-gray-900">{customerName}</p>
                  <p className="text-gray-600 text-xs">{customerEmail}</p>
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block mb-0.5">
                    DÜZENLEME TARİHİ & DURUM
                  </span>
                  <p className="font-bold text-gray-800">{new Date(createdAt).toLocaleDateString("tr-TR")}</p>
                  <span className="text-xs text-blue-600 font-bold">Durum: {status}</span>
                </div>
              </div>

              {/* HESAPLAMA TABLOSU */}
              <div className="border-t border-b border-gray-200 py-3 space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Ara Toplam (KDV Hariç):</span>
                  <span className="font-mono">{subTotal.toLocaleString("tr-TR")} ₺</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Hesaplanan KDV (%20):</span>
                  <span className="font-mono">{kdvAmount.toLocaleString("tr-TR")} ₺</span>
                </div>
                <div className="flex justify-between items-center font-bold text-base pt-2 border-t border-gray-200">
                  <span className="text-gray-900">Toplam Fatura Tutarı (KDV Dahil):</span>
                  <span className="text-blue-600 font-black text-lg">{totalPrice.toLocaleString("tr-TR")} ₺</span>
                </div>
              </div>

              {/* YASAL BİLGİLENDİRME FOOTER */}
              <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-100 text-xs text-blue-900 space-y-1">
                <p className="font-bold">ℹ️ Yasal Bilgilendirme:</p>
                <p className="text-[11px] leading-relaxed text-blue-800 font-medium">
                  İşbu belge 213 sayılı Vergi Usul Kanunu uyarınca E-Arşiv Fatura olarak elektronik ortamda düzenlenmiştir.
                </p>
              </div>
            </div>

            {/* ALT BUTONLAR (FIXED IN FLEX) */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 shrink-0 no-print">
              <button
                onClick={handlePrintInvoice}
                className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-6 py-2.5 rounded-xl text-xs sm:text-sm transition min-h-[44px] cursor-pointer shadow-md flex items-center gap-2"
              >
                <span>🖨️</span>
                <span>Faturayı İndir / Yazdır (Yeni Sekme)</span>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-5 py-2.5 rounded-xl text-xs sm:text-sm transition min-h-[44px] cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
