"use client";

import { useState } from "react";
import toast from "react-hot-toast";

interface OrderHeaderActionsProps {
  orderId: string;
  trackingNumber?: string | null;
  shipmentCompany?: string | null;
}

export default function OrderHeaderActions({
  orderId,
  trackingNumber,
  shipmentCompany,
}: OrderHeaderActionsProps) {
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  const handleCopyTracking = () => {
    if (!trackingNumber || trackingNumber === "Henüz atanmadı") {
      toast.error("Henüz bir kargo takip numarası oluşturulmadı.");
      return;
    }
    navigator.clipboard.writeText(trackingNumber);
    toast.success("Kargo takip numarası panoya kopyalandı! 📋");
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {/* FATURA BUTONU */}
        <button
          onClick={() => setShowInvoiceModal(true)}
          className="inline-flex items-center gap-1.5 bg-white border border-gray-200 text-gray-800 hover:bg-gray-50 font-extrabold px-3.5 py-2.5 rounded-xl text-xs sm:text-sm transition shadow-xs min-h-[44px]"
        >
          <span>📄</span> Faturayı Gör
        </button>

        {/* YAZDIR BUTONU */}
        <button
          onClick={handlePrintInvoice}
          className="inline-flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-bold px-3 py-2.5 rounded-xl text-xs sm:text-sm transition shadow-xs min-h-[44px]"
          title="Yazdır"
        >
          <span>🖨️</span> <span className="hidden sm:inline">Yazdır</span>
        </button>

        {/* KARGO KOPYALA BUTONU */}
        {trackingNumber && trackingNumber !== "Henüz atanmadı" && (
          <button
            onClick={handleCopyTracking}
            className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-100 text-blue-700 hover:bg-blue-100 font-extrabold px-3.5 py-2.5 rounded-xl text-xs sm:text-sm transition shadow-xs min-h-[44px]"
          >
            <span>📋</span> Kargo Kodunu Kopyala
          </button>
        )}
      </div>

      {/* E-FATURA ÖNİZLEME MODALI */}
      {showInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 p-6 sm:p-8 relative">
            <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-xl font-bold">📄</div>
                <div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-gray-900">E-Fatura Görüntüleyici</h3>
                  <p className="text-xs text-gray-500 font-mono">Fatura No: FAT-{orderId.slice(-8).toUpperCase()}</p>
                </div>
              </div>
              <button
                onClick={() => setShowInvoiceModal(false)}
                className="w-8 h-8 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full flex items-center justify-center font-bold transition min-h-[36px] min-w-[36px]"
              >
                ✕
              </button>
            </div>

            {/* ŞIK EFATURA TEMPLATE */}
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 text-xs sm:text-sm space-y-6 font-sans">
              <div className="flex justify-between items-start border-b border-gray-200 pb-4">
                <div>
                  <h4 className="font-extrabold text-lg text-gray-900">TEKNOSHOP TEKNOLOJİ A.Ş.</h4>
                  <p className="text-gray-500 text-xs mt-1">Maslak Mah. Büyükdere Cad. No:123 Sarıyer / İstanbul</p>
                  <p className="text-gray-500 text-xs">Mersis No: 012345678900001 • V.D: Maslak V.D.</p>
                </div>
                <div className="text-right">
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider border border-green-200">
                    ÖDENDİ / E-ARŞİV
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block mb-0.5">Düzenlenme Tarihi</span>
                  <p className="font-bold text-gray-800">{new Date().toLocaleDateString("tr-TR")}</p>
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block mb-0.5">Kargo Şirketi</span>
                  <p className="font-bold text-gray-800">{shipmentCompany || "Yurtiçi Kargo"}</p>
                </div>
              </div>

              <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 text-xs text-blue-900">
                ℹ️ İşbu belge 213 sayılı Vergi Usul Kanunu uyarınca E-Arşiv Fatura olarak elektronik ortamda düzenlenmiştir.
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => window.print()}
                className="bg-gray-900 hover:bg-gray-800 text-white font-extrabold px-6 py-2.5 rounded-xl text-xs sm:text-sm transition min-h-[44px]"
              >
                🖨️ Faturayı İndir / Yazdır
              </button>
              <button
                onClick={() => setShowInvoiceModal(false)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-5 py-2.5 rounded-xl text-xs sm:text-sm transition min-h-[44px]"
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
