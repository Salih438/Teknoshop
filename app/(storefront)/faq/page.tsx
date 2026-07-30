"use client";

import React, { useState } from "react";

const faqs = [
  {
    question: "Siparişim ne zaman kargoya verilir?",
    answer: "Siparişleriniz genellikle 1-2 iş günü içerisinde kargoya teslim edilmektedir. Kampanya dönemlerinde veya resmi tatillerde bu süre 3-4 iş gününe kadar uzayabilir."
  },
  {
    question: "Hangi kargo şirketleri ile çalışıyorsunuz?",
    answer: "Müşterilerimize en iyi hizmeti sunabilmek için Yurtiçi Kargo, Aras Kargo ve seçili bölgelerde Hepsijet ile çalışmaktayız. Kargo seçimi sipariş aşamasında yapılabilir."
  },
  {
    question: "İade süreci nasıl işliyor?",
    answer: "Satın aldığınız ürünü, teslimat tarihinden itibaren 14 gün içerisinde iade edebilirsiniz. Ürünün kullanılmamış, ambalajının hasar görmemiş ve tüm aksesuarlarıyla birlikte eksiksiz olması gerekmektedir. İade işlemini hesabınızdaki 'Siparişlerim' bölümünden başlatabilirsiniz."
  },
  {
    question: "Satın aldığım ürün garantili mi?",
    answer: "Evet, mağazamızda satılan tüm teknolojik ürünler Türkiye distribütörleri tarafından en az 2 yıl resmi garanti altındadır. Faturanız garanti belgesi yerine geçmektedir."
  },
  {
    question: "Taksit seçenekleriniz nelerdir?",
    answer: "Anlaşmalı kredi kartlarına vade farksız 3 veya 6 aya varan taksit seçeneklerimiz mevcuttur. Ödeme sayfasında kart bilgilerinizi girdiğinizde uygun taksit oranlarını görebilirsiniz."
  }
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">Sıkça Sorulan Sorular</h1>
          <p className="text-lg text-gray-600">
            Aklınıza takılan soruların cevaplarını burada bulabilirsiniz. Aradığınız cevabı bulamadıysanız iletişim sayfamızdan bize ulaşabilirsiniz.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div 
              key={index} 
              className={`bg-white border rounded-2xl overflow-hidden transition-all duration-300 ${openIndex === index ? 'border-blue-500 shadow-md ring-1 ring-blue-500/20' : 'border-gray-200 shadow-sm hover:border-gray-300'}`}
            >
              <button
                className="w-full px-6 py-5 flex items-center justify-between focus:outline-none"
                onClick={() => toggleFAQ(index)}
              >
                <span className="font-semibold text-left text-gray-900 pr-4">{faq.question}</span>
                <span className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-blue-50 text-blue-600 transition-transform duration-300 ${openIndex === index ? 'rotate-180' : ''}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </span>
              </button>
              
              <div 
                className={`overflow-hidden transition-all duration-300 ease-in-out ${openIndex === index ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}
              >
                <div className="px-6 pb-6 text-gray-600 leading-relaxed border-t border-gray-100 pt-4 mt-2 mx-2">
                  {faq.answer}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center p-8 bg-blue-50 rounded-3xl border border-blue-100">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Başka bir sorunuz mu var?</h3>
          <p className="text-gray-600 mb-6">Destek ekibimiz size yardımcı olmaktan memnuniyet duyacaktır.</p>
          <a href="/contact" className="inline-block bg-blue-600 text-white font-bold px-8 py-3 rounded-xl hover:bg-blue-700 transition shadow-md shadow-blue-500/20">
            Bize Ulaşın
          </a>
        </div>
      </div>
    </div>
  );
}
