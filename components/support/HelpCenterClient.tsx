"use client";

import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";

interface FAQItem {
  id: string;
  category: "order" | "return" | "payment" | "account";
  question: string;
  answer: string;
}

const FAQ_LIST: FAQItem[] = [
  {
    id: "faq-1",
    category: "order",
    question: "Siparişim nerede ve kargomu nasıl takip edebilirim?",
    answer: "Siparişinizi hesabınızdaki 'Siparişlerim' sekmesinden veya Sipariş Detay sayfasında yer alan Canlı Sipariş Takip Çubuğu ve Kargo Takip Kodu ile 7/24 anlık takip edebilirsiniz."
  },
  {
    id: "faq-2",
    category: "order",
    question: "Kargom gecikti, ne yapmalıyım?",
    answer: "Siparişleriniz ortalama 1-2 iş günü içerisinde kargo firmasına teslim edilir. Olumsuz hava koşulları veya yoğunluk durumunda kargo takip numaranız ile kargo şubesiyle doğrudan iletişime geçebilir ya da Canlı Destek ekibimize bağlanabilirsiniz."
  },
  {
    id: "faq-3",
    category: "return",
    question: "İade süreci nasıl işler ve 14 gün kuralı nedir?",
    answer: "Teslim aldığınız ürünü 14 gün içerisinde hiçbir gerekçe göstermeksizin ücretsiz iade edebilirsiniz. Sipariş Detay sayfasından 'İade Talebi Oluştur' butonuna basarak ücretsiz kargo iade kodunuzu alabilirsiniz."
  },
  {
    id: "faq-4",
    category: "return",
    question: "Beden veya renk değişimi nasıl yapılır?",
    answer: "Ürün iade etmek yerine stokta bulunan farklı bir beden veya renk ile değişim yapabilirsiniz. Sipariş Detay sayfasındaki 'Değişim Talebi Oluştur' butonunu kullanarak yeni istediğiniz varyasyonu seçebilirsiniz."
  },
  {
    id: "faq-5",
    category: "account",
    question: "Kayıtlı teslimat adresimi nasıl güncellerim?",
    answer: "Hesabım ➔ Adreslerim sekmesine giderek mevcut adreslerinizi düzenleyebilir veya 'Yeni Adres Ekle' butonuna basarak yeni bir adres ekleyebilirsiniz."
  },
  {
    id: "faq-6",
    category: "payment",
    question: "İndirim Kuponunu ödeme adımında nasıl kullanırım?",
    answer: "Sepetinizden Checkout (Ödeme) sayfasına geçtiğinizde sağ taraftaki Sipariş Özeti alanında 'İndirim Kuponu Var mı?' kutusuna kupon kodunuzu girip 'Uygula' butonuna basmanız yeterlidir."
  },
  {
    id: "faq-7",
    category: "order",
    question: "E-Faturamı nasıl görüntüleyebilir ve indirebilirim?",
    answer: "Sipariş Detay sayfasında yer alan 'Faturayı Gör' veya 'Yazdır' butonlarına tıklayarak E-Arşiv Faturanıza anında ulaşabilir, PDF olarak kaydedebilirsiniz."
  },
  {
    id: "faq-8",
    category: "payment",
    question: "Ödeme adımında hata aldım, kartımdan para Çekildi mi?",
    answer: "Ödeme esnasında hata almanız durumunda siparişiniz oluşturulmaz ve paranız çekilmez. Olası 3D Secure veya limit hatalarında bankanızla iletişime geçebilirsiniz."
  },
  {
    id: "faq-9",
    category: "order",
    question: "Stokta tükenen bir ürün ne zaman yeniden stoğa girer?",
    answer: "Stoklarımız düzenli olarak güncellenmektedir. İlgili ürün sayfasındaki 'Gelince Haber Ver' seçeneğini işaretleyerek stoklar yenilendiğinde anında e-posta alabilirsiniz."
  },
  {
    id: "faq-10",
    category: "account",
    question: "Ürünleri favorilerime nasıl eklerim?",
    answer: "Beğendiğiniz ürün kartlarındaki veya ürün detay sayfasındaki kalp (❤️) simgesine tıklayarak ürünleri Favoriler listenize ekleyebilirsiniz."
  },
  {
    id: "faq-11",
    category: "account",
    question: "Bildirim merkezini ve bildirimlerimi nasıl yönetirim?",
    answer: "Navbar sağ üstteki 🔔 bildirim çanına tıklayarak son bildirimlerinizi görebilir, 'Tüm Bildirimleri Gör' seçeneği ile detaylı bildirim merkezinize ulaşabilirsiniz."
  }
];

export default function HelpCenterClient() {
  const [searchQuery, setSearchQuery] = useState("");
  const [openIndex, setOpenIndex] = useState<string | null>("faq-1");
  const [ticketCategory, setTicketCategory] = useState("siparis");
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLiveChatModal, setShowLiveChatModal] = useState(false);

  const toggleFAQ = (id: string) => {
    setOpenIndex(openIndex === id ? null : id);
  };

  const filteredFAQs = FAQ_LIST.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketMessage.trim()) {
      toast.error("Lütfen konu ve mesaj alanlarını doldurunuz.");
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      toast.success("Destek talebiniz başarıyla oluşturuldu! Müşteri temsilcimiz en kısa sürede dönüş yapacaktır. 📬");
      setTicketSubject("");
      setTicketMessage("");
    }, 600);
  };

  return (
    <div className="space-y-10 sm:space-y-12">
      
      {/* 🚀 HERO SECTION & BÜYÜK ARAMA KUTUSU */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 rounded-3xl p-6 sm:p-12 text-white shadow-xl relative overflow-hidden text-center flex flex-col items-center justify-center min-h-[260px] sm:min-h-[320px]">
        <div className="relative z-10 max-w-2xl w-full">
          <span className="bg-white/20 text-blue-100 px-3.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider mb-3 inline-block border border-white/20">
            Vitrin Destek Merkezi
          </span>
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight mb-3">
            Size Nasıl Yardımcı Olabiliriz?
          </h1>
          <p className="text-blue-100 text-xs sm:text-base font-medium mb-6 max-w-lg mx-auto">
            Siparişleriniz, iade süreçleriniz ve kargo takibiniz ile ilgili merak ettiğiniz tüm soruların yanıtları burada.
          </p>

          {/* Büyük Arama Kutusu */}
          <div className="relative w-full shadow-lg">
            <span className="absolute left-4 top-3.5 sm:top-4 text-gray-400 text-lg">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Sorunuzu yazın (örn: İade nasıl yapılır, kargo gecikti...)"
              className="w-full pl-11 pr-4 py-3.5 sm:py-4 rounded-2xl bg-white text-gray-900 placeholder-gray-400 text-xs sm:text-base outline-none focus:ring-4 focus:ring-blue-400/50 transition font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-3.5 sm:top-4 text-gray-400 hover:text-gray-600 font-bold text-xs bg-gray-100 px-2 py-1 rounded-lg"
              >
                Temizle
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 🚀 HIZLI İŞLEM KARTLARI (QUICK ACTION CARDS) */}
      <div className="space-y-4">
        <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 flex items-center gap-2">
          <span>⚡</span> Hızlı İşlemler
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          <Link
            href="/profile"
            className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-xs hover:shadow-md hover:border-blue-200 transition group flex flex-col items-start min-h-[90px]"
          >
            <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">📦</span>
            <h3 className="font-extrabold text-gray-900 text-xs sm:text-sm">Sipariş Takibi</h3>
            <p className="text-[11px] text-gray-500 mt-0.5 font-medium">Sipariş durumunu ve kargonuzu izleyin</p>
          </Link>

          <Link
            href="/profile"
            className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-xs hover:shadow-md hover:border-blue-200 transition group flex flex-col items-start min-h-[90px]"
          >
            <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">↩️</span>
            <h3 className="font-extrabold text-gray-900 text-xs sm:text-sm">İade Başlat</h3>
            <p className="text-[11px] text-gray-500 mt-0.5 font-medium">14 gün içinde ücretsiz iade kodu alın</p>
          </Link>

          <Link
            href="/profile"
            className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-xs hover:shadow-md hover:border-blue-200 transition group flex flex-col items-start min-h-[90px]"
          >
            <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">🔁</span>
            <h3 className="font-extrabold text-gray-900 text-xs sm:text-sm">Değişim Başlat</h3>
            <p className="text-[11px] text-gray-500 mt-0.5 font-medium">Beden veya renk değişimi oluşturun</p>
          </Link>

          <Link
            href="/profile"
            className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-xs hover:shadow-md hover:border-blue-200 transition group flex flex-col items-start min-h-[90px]"
          >
            <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">📍</span>
            <h3 className="font-extrabold text-gray-900 text-xs sm:text-sm">Adreslerim</h3>
            <p className="text-[11px] text-gray-500 mt-0.5 font-medium">Teslimat adreslerini yönetin</p>
          </Link>

          <Link
            href="/favorites"
            className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-xs hover:shadow-md hover:border-blue-200 transition group flex flex-col items-start min-h-[90px]"
          >
            <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">❤️</span>
            <h3 className="font-extrabold text-gray-900 text-xs sm:text-sm">Favorilerim</h3>
            <p className="text-[11px] text-gray-500 mt-0.5 font-medium">Kaydettiğiniz ürünleri görün</p>
          </Link>

          <Link
            href="/profile/notifications"
            className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-xs hover:shadow-md hover:border-blue-200 transition group flex flex-col items-start min-h-[90px]"
          >
            <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">🔔</span>
            <h3 className="font-extrabold text-gray-900 text-xs sm:text-sm">Bildirimlerim</h3>
            <p className="text-[11px] text-gray-500 mt-0.5 font-medium">Duyuru ve kampanya bildirimleri</p>
          </Link>

          <Link
            href="/profile"
            className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-xs hover:shadow-md hover:border-blue-200 transition group flex flex-col items-start min-h-[90px]"
          >
            <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">👤</span>
            <h3 className="font-extrabold text-gray-900 text-xs sm:text-sm">Hesap Ayarları</h3>
            <p className="text-[11px] text-gray-500 mt-0.5 font-medium">Kişisel bilgilerinizi güncelleyin</p>
          </Link>

          <button
            onClick={() => setShowLiveChatModal(true)}
            className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 sm:p-5 rounded-2xl border border-blue-200 shadow-xs hover:shadow-md transition group flex flex-col items-start min-h-[90px] text-left"
          >
            <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">💬</span>
            <h3 className="font-extrabold text-blue-900 text-xs sm:text-sm">Canlı Destek</h3>
            <p className="text-[11px] text-blue-700 mt-0.5 font-medium">7/24 Anlık temsilciye bağlanın</p>
          </button>
        </div>
      </div>

      {/* 🚀 SIKÇA SORULAN SORULAR (FAQ ACCORDION) */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 flex items-center gap-2">
            <span>❓</span> Sıkça Sorulan Sorular
          </h2>
          <span className="text-xs font-bold text-gray-500">{filteredFAQs.length} Soru Listeleniyor</span>
        </div>

        <div className="space-y-3">
          {filteredFAQs.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-gray-100 text-center text-gray-500 text-xs sm:text-sm">
              Aramanıza uygun soru bulunamadı. Lütfen farklı anahtar kelimeler deneyin veya aşağıdaki destek formunu doldurun.
            </div>
          ) : (
            filteredFAQs.map((faq) => {
              const isOpen = openIndex === faq.id;
              return (
                <div
                  key={faq.id}
                  className={`bg-white border rounded-2xl overflow-hidden transition-all duration-200 ${
                    isOpen ? "border-blue-500 shadow-sm ring-2 ring-blue-500/10" : "border-gray-100 hover:border-gray-200"
                  }`}
                >
                  <button
                    onClick={() => toggleFAQ(faq.id)}
                    aria-expanded={isOpen}
                    className="w-full px-5 py-4 flex items-center justify-between text-left focus:outline-none min-h-[44px]"
                  >
                    <span className="font-extrabold text-gray-900 text-xs sm:text-sm pr-4 flex items-center gap-2">
                      <span className="text-blue-600 text-base">Q.</span>
                      {faq.question}
                    </span>
                    <span className={`w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center transition-transform duration-200 flex-shrink-0 ${isOpen ? "rotate-180" : ""}`}>
                      ▼
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 text-gray-600 text-xs sm:text-sm leading-relaxed border-t border-gray-100 pt-3 bg-gray-50/40">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 🚀 İLETİŞİM & DESTEK KARTLARI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-xl flex-shrink-0">
            📞
          </div>
          <div>
            <h4 className="font-extrabold text-gray-900 text-sm">Telefon İletişim</h4>
            <p className="text-xs font-mono font-bold text-blue-600 mt-0.5">0850 123 45 67</p>
            <p className="text-[11px] text-gray-500">Hafta içi: 09:00 - 18:00</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center text-xl flex-shrink-0">
            ✉️
          </div>
          <div>
            <h4 className="font-extrabold text-gray-900 text-sm">E-Posta Destek</h4>
            <p className="text-xs font-bold text-gray-800 mt-0.5">destek@antigravity.com</p>
            <p className="text-[11px] text-gray-500">24 saat içinde dönüş</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center text-xl flex-shrink-0">
            💬
          </div>
          <div>
            <h4 className="font-extrabold text-gray-900 text-sm">Canlı Asistan</h4>
            <span className="inline-block bg-green-100 text-green-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full mt-0.5">
              🟢 Aktif (7/24)
            </span>
          </div>
        </div>
      </div>

      {/* 🚀 DESTEK TALEBİ FORMU (MOCK SUPPORT TICKET FORM) */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-xs space-y-6">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
            <span>📬</span> Destek Talebi Oluşturun
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 font-medium">
            Aradığınız cevabı bulamadıysanız mesaj bırakın, müşteri temsilcilerimiz en kısa sürede dönüş yapsın.
          </p>
        </div>

        <form onSubmit={handleTicketSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-1.5">
                Kategori
              </label>
              <select
                value={ticketCategory}
                onChange={(e) => setTicketCategory(e.target.value)}
                className="w-full px-3.5 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-xs sm:text-sm bg-white min-h-[44px]"
              >
                <option value="siparis">Sipariş & Kargo Süreçleri</option>
                <option value="iade">İade ve Değişim Talebi</option>
                <option value="odeme">Ödeme ve Fatura Sorunları</option>
                <option value="teknik">Teknik Destek & Garanti</option>
                <option value="diger">Diğer Konular</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-1.5">
                Konu Başlığı
              </label>
              <input
                type="text"
                value={ticketSubject}
                onChange={(e) => setTicketSubject(e.target.value)}
                placeholder="Örn: Siparişim kargoya verilmedi"
                className="w-full px-3.5 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-xs sm:text-sm min-h-[44px]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-1.5">
              Detaylı Açıklamanız
            </label>
            <textarea
              rows={4}
              value={ticketMessage}
              onChange={(e) => setTicketMessage(e.target.value)}
              placeholder="Sorununuzu veya talebinizi detaylı olarak yazınız..."
              className="w-full px-3.5 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-xs sm:text-sm resize-none"
            />
          </div>

          {/* Dosya / Fotoğraf Ekleme Placeholder */}
          <div className="p-3.5 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 flex items-center justify-between text-xs text-gray-500">
            <span className="flex items-center gap-2">
              <span>📎</span> Görsel veya Ek Dosya Ekle (İsteğe Bağlı)
            </span>
            <span className="text-[10px] bg-white border border-gray-200 px-2 py-1 rounded font-bold text-gray-700">PNG, JPG, PDF (Max 5MB)</span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gray-900 hover:bg-gray-800 text-white font-extrabold py-3.5 rounded-xl transition text-xs sm:text-sm shadow-xs min-h-[44px] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? "Gönderiliyor..." : "Destek Talebini Gönder ➔"}
          </button>
        </form>
      </div>

      {/* CANLI DESTEK SİMÜLASYON MODALI */}
      {showLiveChatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 relative text-center space-y-4">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto text-3xl">
              💬
            </div>
            <h3 className="text-xl font-extrabold text-gray-900">Vitrin Canlı Asistan</h3>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              Müşteri temsilcimiz <span className="font-bold text-gray-900">Zeynep</span> birazdan bağlanıyor. Sorularınızı yanıtlamaktan memnuniyet duyacaktır.
            </p>
            <div className="p-3 bg-blue-50 text-blue-900 rounded-xl text-xs font-bold animate-pulse">
              ⏳ Temsilciye baglanılıyor...
            </div>
            <button
              onClick={() => setShowLiveChatModal(false)}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-extrabold py-2.5 rounded-xl text-xs transition min-h-[44px]"
            >
              Kapat
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
