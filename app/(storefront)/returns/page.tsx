import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "İade ve Değişim Şartları | Antigravity E-Ticaret",
  description: "Antigravity E-Ticaret iade ve değişim süreçleri hakkında bilgilendirme.",
};

export default function ReturnsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white p-8 md:p-12 rounded-3xl border border-gray-100 shadow-sm">
          <div className="text-center mb-10 pb-8 border-b border-gray-100">
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">İade ve Değişim Şartları</h1>
            <p className="text-gray-500">Son Güncelleme: 1 Ocak 2026</p>
          </div>

          <div className="prose prose-blue prose-lg max-w-none text-gray-700">
            <h3>1. Cayma Hakkı ve İade Süresi</h3>
            <p>
              Tüketici Kanunu'na göre, satın almış olduğunuz ürünü teslim aldığınız tarihten itibaren <strong>14 gün</strong> içerisinde hiçbir gerekçe göstermeksizin ve cezai şart ödemeksizin iade edebilirsiniz. Cayma hakkının kullanılması için bu süre içerisinde firmamıza bildirimde bulunulması ve ürünün kullanılmamış olması şarttır.
            </p>

            <h3>2. İade Şartları</h3>
            <p>Ürün iadesinin kabul edilebilmesi için aşağıdaki şartların sağlanması gerekmektedir:</p>
            <ul>
              <li>Ürün orijinal ambalajında, kutusu açılmamış, yırtılmamış ve hasar görmemiş olmalıdır.</li>
              <li>Ürün kullanılmamış olmalı ve yeniden satılabilirliğini kaybetmemelidir.</li>
              <li>Cep telefonu, bilgisayar, tablet gibi elektronik ürünlerde kurulum yapılmamış, sim kart takılmamış ve wi-fi ağına bağlanılmamış olması zorunludur.</li>
              <li>Kurulumu servis tarafından yapılması gereken ürünlerin kutusu, kesinlikle yetkili servis tarafından açılmalıdır. Aksi halde ürün garanti kapsamı dışına çıkar ve iade alınmaz.</li>
              <li>Tüm standart aksesuarlar, garanti belgesi ve kullanım kılavuzları eksiksiz olarak gönderilmelidir.</li>
            </ul>

            <h3>3. İade Edilemeyen Ürünler</h3>
            <p>Yasal mevzuat gereği aşağıdaki ürünlerin iadesi <strong>kabul edilmemektedir</strong>:</p>
            <ul>
              <li>Kutusu açılmış ve kullanılmış kulak içi kulaklıklar (hijyen kuralları gereği).</li>
              <li>Tek kullanımlık ürünler ve hızlı bozulan veya son kullanma tarihi geçme ihtimali olan mallar.</li>
              <li>Tüketicinin istekleri veya kişisel ihtiyaçları doğrultusunda özel olarak üretilen ürünler.</li>
              <li>Dijital içerikler, yazılım programları ve veri kaydedebilen cihazlar (ambalajı açılmışsa).</li>
            </ul>

            <h3>4. İade ve Değişim Süreci Nasıl İşler?</h3>
            <ol>
              <li>Hesabınıza giriş yaparak "Siparişlerim" menüsünden ilgili siparişi bulun ve "İade Et" butonuna tıklayın.</li>
              <li>İade nedeninizi seçerek sistemin size vereceği <strong>Ücretsiz İade Kargo Kodunu</strong> not edin.</li>
              <li>Ürünü, faturası ve tüm aparatlarıyla birlikte sağlam bir şekilde paketleyin.</li>
              <li>Anlaşmalı olduğumuz kargo firmasına paketi ve iade kodunu teslim edin. (İade gönderilerinde kargo ücreti tarafımıza aittir).</li>
            </ol>

            <h3>5. Ücret İadesi</h3>
            <p>
              İade edilen ürün firmamıza ulaştıktan sonra kalite kontrol ekibimiz tarafından incelenir. İade şartlarına uygun olduğu onaylanan ürünlerin ücret iadesi <strong>3 iş günü</strong> içerisinde yapılmaktadır. İadenin banka veya kredi kartı hesabınıza yansıma süresi, bankanızın işlem süreçlerine bağlı olarak 2-7 iş gününü bulabilir.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
