"use client";

export default function PrintInvoiceButton() {
  return (
    <button
      onClick={() => window.print()}
      className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-extrabold px-4 py-2.5 rounded-xl transition flex items-center gap-1.5"
    >
      <span>📄 Fatura Yazdır</span>
    </button>
  );
}
