"use client";

import { useState, useEffect } from "react";
import { env } from "@/lib/env";
import { calculateInvoice, formatCurrency, InvoiceCalculationResult } from "@/lib/utils/invoice-calculator";

interface OrderInvoiceModalProps {
  orderId: string;
  customerName: string;
  customerEmail: string;
  totalPrice: number;
  createdAt: string;
  status: string;
  discountAmount?: number;
  paymentFee?: number;
  shippingCost?: number;
  items?: { price: number; quantity: number }[];
}

interface StoreSettingsData {
  phone?: string | null;
  email?: string | null;
  address?: string | null;
}

interface CustomerAddressData {
  title?: string | null;
  address?: string | null;
  district?: string | null;
  city?: string | null;
}

interface DetailedInvoiceData {
  orderCode: string;
  formattedDate: string;
  store: { name: string; address: string; phone: string; email: string };
  customer: { name: string; email: string; address?: CustomerAddressData | null };
  payment: { method: string; status: string; fee: number };
  shipment: { company: string; trackingNumber: string; cost: number };
  items: {
    id: string;
    name: string;
    combination: string | null;
    sku: string;
    quantity: number;
    price: number;
    total: number;
  }[];
  calculation: InvoiceCalculationResult;
}

export default function OrderInvoiceModal({
  orderId,
  customerName,
  customerEmail,
  totalPrice,
  createdAt,
  status,
  discountAmount,
  paymentFee,
  shippingCost,
  items,
}: OrderInvoiceModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [storeSettings, setStoreSettings] = useState<StoreSettingsData | null>(null);
  const [detailedData, setDetailedData] = useState<DetailedInvoiceData | null>(null);

  // Synchronous baseline calculation using shared invoice calculator
  const fallbackInvoice = calculateInvoice({
    totalPrice,
    discountAmount,
    paymentFee,
    shippingCost,
    items,
  });

  const invoice = detailedData?.calculation || fallbackInvoice;
  const formattedInvoiceNo = detailedData?.orderCode || `FAT-${orderId.slice(-8).toUpperCase()}`;

  const storeName = detailedData?.store?.name || env.NEXT_PUBLIC_STORE_NAME || "TEKNOSHOP TEKNOLOJİ A.Ş.";
  const storeAddress = detailedData?.store?.address || storeSettings?.address || "Maslak Mah. Büyükdere Cad. No:123 Sarıyer / İstanbul";
  const storePhone = detailedData?.store?.phone || storeSettings?.phone || "0850 123 45 67";
  const storeEmail = detailedData?.store?.email || storeSettings?.email || "fatura@teknoshop.com";

  useEffect(() => {
    if (!isOpen) return;

    if (!storeSettings) {
      fetch("/api/settings")
        .then((res) => res.json())
        .then((data) => {
          if (data && !data.error) setStoreSettings(data);
        })
        .catch(() => {});
    }

    let isMounted = true;
    fetch(`/api/orders/${orderId}/invoice?format=json`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data && data.success) {
          setDetailedData(data);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [isOpen, orderId, storeSettings]);

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

              {/* SİPARİŞ KALEMLERİ TABLOSU */}
              {detailedData?.items && detailedData.items.length > 0 && (
                <div className="border-t border-b border-gray-200 py-3 space-y-2">
                  <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block mb-1">
                    SİPARİŞ KALEMLERİ ({detailedData.items.length} Kalem)
                  </span>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                    {detailedData.items.map((item) => (
                      <div key={item.id} className="flex justify-between items-center text-xs bg-white p-2 rounded-lg border border-gray-100">
                        <div className="min-w-0 pr-2">
                          <p className="font-bold text-gray-900 truncate">{item.name}</p>
                          {item.combination && (
                            <span className="text-[10px] text-gray-400 block">{item.combination}</span>
                          )}
                        </div>
                        <div className="text-right shrink-0 font-mono">
                          <span className="text-gray-500 mr-2">{item.quantity} × {item.price.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺</span>
                          <span className="font-bold text-gray-900">{item.total.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* HESAPLAMA TABLOSU (BE-08 UNIFIED BREAKDOWN) */}
              <div className="border-t border-b border-gray-200 py-3 space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between text-gray-700">
                  <span>Ürünler Toplamı:</span>
                  <span className="font-mono">{formatCurrency(invoice.subTotal)}</span>
                </div>

                {invoice.discount > 0 && (
                  <div className="flex justify-between text-green-600 font-bold">
                    <span>Kupon İndirimi:</span>
                    <span className="font-mono">-{formatCurrency(invoice.discount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-gray-700">
                  <span>Kargo Ücreti:</span>
                  <span className="font-mono">
                    {invoice.shippingCost === 0 ? (
                      <span className="text-green-600 font-bold">Ücretsiz (0,00 ₺)</span>
                    ) : (
                      formatCurrency(invoice.shippingCost)
                    )}
                  </span>
                </div>

                {invoice.paymentFee > 0 && (
                  <div className="flex justify-between text-gray-700">
                    <span>Ödeme Hizmet Bedeli:</span>
                    <span className="font-mono">{formatCurrency(invoice.paymentFee)}</span>
                  </div>
                )}

                <div className="flex justify-between text-gray-500 pt-2 border-t border-dashed border-gray-200 text-xs">
                  <span>KDV Hariç Matrah:</span>
                  <span className="font-mono">{formatCurrency(invoice.netAmount)}</span>
                </div>

                <div className="flex justify-between text-gray-500 text-xs">
                  <span>Hesaplanan KDV (%20 Dahil):</span>
                  <span className="font-mono">{formatCurrency(invoice.kdvAmount)}</span>
                </div>

                <div className="flex justify-between items-center font-bold text-base pt-2 border-t border-gray-200">
                  <span className="text-gray-900">Toplam Fatura Tutarı (KDV Dahil):</span>
                  <span className="text-blue-600 font-black text-lg">{formatCurrency(invoice.totalPrice)}</span>
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
