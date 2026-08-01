"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global Error Caught:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl max-w-md w-full text-center space-y-5 animate-in fade-in duration-300">
        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto text-2xl font-bold">
          ⚠️
        </div>
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900">Bir Hata Oluştu</h2>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            İsteğiniz işlenirken beklenmeyen bir durum oluştu. Lütfen tekrar deneyiniz veya ana sayfaya dönünüz.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-5 py-3 rounded-xl transition text-sm shadow-xs"
          >
            Tekrar Dene
          </button>
          <Link
            href="/"
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-extrabold px-5 py-3 rounded-xl transition text-sm border border-gray-200"
          >
            Ana Sayfa
          </Link>
        </div>
      </div>
    </div>
  );
}
