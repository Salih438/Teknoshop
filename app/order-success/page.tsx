import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function OrderSuccessPage({ searchParams }: { searchParams: Promise<{ orderId?: string }> }) {
  const resolvedParams = await searchParams;
  const orderId = resolvedParams.orderId;

  if (!orderId) {
    return (
      <div className="min-h-[80vh] bg-white flex flex-col items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] border border-gray-100 p-8 md:p-10 text-center animate-in fade-in zoom-in duration-500">
          <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner relative">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-3 tracking-tight">Sipariş Bulunamadı</h1>
          <p className="text-gray-500 text-sm leading-relaxed mb-6">
            Lütfen sipariş numaranızı kontrol edin veya destek ile iletişime geçin.
          </p>
          <Link href="/" className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">
            Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    );
  }

  // Güvenlik: Sadece giriş yapmış kullanıcılar siparişlerini görebilir
  const clerkUser = await currentUser();
  if (!clerkUser) redirect("/");

  const email = clerkUser.emailAddresses[0]?.emailAddress;
  if (!email) redirect("/");

  const dbUser = await prisma.user.findUnique({ where: { email } });
  if (!dbUser) redirect("/");

  // Siparişi veritabanından çek ve kullanıcının olduğuna emin ol
  const order = await prisma.order.findUnique({
    where: { id: orderId }
  });

  if (!order || order.userId !== dbUser.id) {
    return (
      <div className="min-h-[80vh] bg-white flex flex-col items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] border border-gray-100 p-8 md:p-10 text-center animate-in fade-in zoom-in duration-500">
          <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner relative">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-3 tracking-tight">Yetkisiz Erişim</h1>
          <p className="text-gray-500 text-sm leading-relaxed mb-6">
            Girdiğiniz sipariş numarasına ait kayıt bulunamadı veya bu siparişi görüntüleme yetkiniz yok.
          </p>
          <Link href="/" className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">
            Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    );
  }

  // Sipariş Numarasını Kısa Formatlı Göster (VT-XXXXX)
  const shortOrderNumber = `VT-${order.id.slice(-8).toUpperCase()}`;

  return (
    <div className="min-h-[80vh] bg-white flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] border border-gray-100 p-8 md:p-10 text-center animate-in fade-in zoom-in duration-500">
        
        {/* Onay İkonu */}
        <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner relative">
          <div className="absolute inset-0 border-4 border-green-100 rounded-full animate-ping opacity-20"></div>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {/* Başlık ve Mesaj */}
        <h1 className="text-3xl font-extrabold text-gray-900 mb-3 tracking-tight">Siparişiniz Alındı!</h1>
        <p className="text-gray-500 text-sm leading-relaxed mb-6">
          Harika bir seçim! Siparişiniz başarıyla oluşturuldu. Teslimat süreciyle ilgili detayları kısa süre içinde e-posta adresinize göndereceğiz.
        </p>

        {/* Sipariş Numarası Kutusu */}
        <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-4 mb-4">
          <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1">Sipariş Numarası</p>
          <p className="text-xl font-mono font-extrabold text-blue-600">
            {shortOrderNumber}
          </p>
        </div>

        {/* Toplam Tutar */}
        <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-4 mb-8">
          <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1">Toplam Tutar</p>
          <p className="text-xl font-extrabold text-gray-900">
            {order.totalPrice.toLocaleString("tr-TR")} ₺
          </p>
        </div>

        {/* Aksiyon Butonları */}
        <div className="space-y-3">
          <Link 
            href="/profile" 
            className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            Siparişlerimi Takip Et
          </Link>
          <Link 
            href="/products" 
            className="flex items-center justify-center gap-2 w-full bg-white text-gray-700 border-2 border-gray-100 py-3.5 rounded-xl font-bold hover:bg-gray-50 hover:border-gray-200 transition-all"
          >
            Alışverişe Devam Et
          </Link>
        </div>

        {/* Bilgilendirme Dipnotu */}
        <p className="text-xs text-gray-400 mt-8 font-medium">
          Sorularınız için <span className="text-blue-600 cursor-pointer hover:underline">Müşteri Hizmetleri</span> ile iletişime geçebilirsiniz.
        </p>

      </div>
    </div>
  );
}