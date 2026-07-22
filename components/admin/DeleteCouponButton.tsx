// Dosya: components/admin/DeleteCouponButton.tsx
"use client"; // 🚀 Tarayıcı özellikleri (onClick, confirm) için bu şart!

import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function DeleteCouponButton({ id }: { id: string }) {
  const router = useRouter();
  
  const handleDelete = async () => {
    // Tarayıcının uyarı penceresi artık sorunsuz çalışacak
    if (window.confirm('Bu kuponu kalıcı olarak silmek istediğinize emin misiniz?')) {
      try {
        const res = await fetch(`/api/admin/coupons/${id}`, {
          method: 'DELETE',
        });
        
        if (!res.ok) {
          const data = await res.json();
          toast.error(data.error || 'Silme işlemi başarısız oldu.');
          return;
        }

        toast.success('Kupon başarıyla silindi.');
        router.refresh();
      } catch (error) {
        toast.error('Bir hata oluştu.');
      }
    }
  };

  return (
    <button 
      onClick={handleDelete}
      className="px-4 py-2 text-sm font-bold rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors flex items-center gap-1"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
      Sil
    </button>
  );
}