import Link from "next/link";

export default function OrderSuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-gray-100 p-8 text-center animate-in fade-in zoom-in duration-500">
        
        {/* Onay İkonu (Orijinal SVG ve Zıplama Animasyonu) */}
        <div className="w-20 h-20 bg-green-50 border-2 border-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm animate-bounce">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {/* Başlık ve Mesaj */}
        <h1 className="text-3xl font-extrabold text-gray-900 mb-3">Siparişiniz Alındı!</h1>
        <p className="text-gray-500 text-sm leading-relaxed mb-8">
          Harika bir seçim! Siparişiniz başarıyla oluşturuldu ve onaylandı. Teslimat detayları kısa süre içinde e-posta adresinize gönderilecektir.
        </p>

        {/* Aksiyon Butonları */}
        <div className="space-y-3">
          <Link 
            href="/profile" 
            className="block w-full bg-blue-600 text-white py-3.5 rounded-2xl font-extrabold hover:bg-blue-700 transition shadow-md hover:shadow-lg hover:-translate-y-0.5"
          >
            📦 Siparişlerimi Takip Et
          </Link>
          <Link 
            href="/products" 
            className="block w-full bg-gray-100 text-gray-700 py-3.5 rounded-2xl font-bold hover:bg-gray-200 transition"
          >
            🛍️ Alışverişe Devam Et
          </Link>
        </div>

        {/* Bilgilendirme Dipnotu */}
        <p className="text-xs text-gray-400 mt-8">
          Herhangi bir sorunuz olması durumunda müşteri hizmetlerimizle iletişime geçebilirsiniz.
        </p>

      </div>
    </div>
  );
}