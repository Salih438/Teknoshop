"use client";

import toast from "react-hot-toast";

export default function ReferralCopyCard({ referralCode }: { referralCode: string }) {
  const handleCopy = () => {
    navigator.clipboard.writeText(referralCode);
    toast.success("Davet kodunuz kopyalandı! Arkadaşlarınızla paylaşabilirsiniz 🎉");
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-2xs text-left flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="space-y-1">
        <span className="bg-purple-100 text-purple-900 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-purple-200">
          👥 ARKADAŞINI DAVET ET & KAZAN
        </span>
        <h3 className="text-lg font-black text-gray-900">Özel Referans Kodunuz</h3>
        <p className="text-xs text-gray-500 font-medium max-w-md">
          Bu kodu arkadaşlarınızla paylaşın. Arkadaşınız ilk alışverişini yaptığında her ikiniz de <strong>500 Vitrin Puan</strong> kazanın!
        </p>
      </div>

      <div className="flex items-center gap-2 bg-gray-50 p-2.5 rounded-2xl border border-gray-200 w-full sm:w-auto">
        <span className="font-mono font-black text-blue-600 text-sm px-3">{referralCode}</span>
        <button
          onClick={handleCopy}
          className="bg-gray-900 hover:bg-gray-800 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition min-h-[36px]"
        >
          Kopyala
        </button>
      </div>
    </div>
  );
}
