import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kullanım Koşulları ve Mesafeli Satış Sözleşmesi | E-Ticaret Teknoloji",
  description: "Web sitemizin kullanım koşulları, iade politikaları ve mesafeli satış sözleşmesi.",
};

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-4">Kullanım Koşulları</h1>
        <div className="w-24 h-1 bg-blue-600 mx-auto rounded"></div>
      </div>

      <div className="space-y-8 text-gray-600 leading-relaxed text-base">
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">1. Taraflar ve Sözleşmenin Konusu</h2>
          <p>
            Bu sözleşme, E-Ticaret Teknoloji A.Ş. (bundan böyle "Satıcı" olarak anılacaktır) ile platform üzerinden elektronik ortamda sipariş veren Kullanıcı (bundan böyle "Alıcı" olarak anılacaktır) arasındaki mesafeli satış hükümlerini, cayma hakkını ve sitenin genel kullanım koşullarını düzenler. Sitemizi kullanarak veya sipariş oluşturarak bu koşulları peşinen kabul etmiş sayılırsınız.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">2. Ürün ve Fiyat Bilgileri</h2>
          <p>
            Platformumuzda sergilenen teknolojik ürünlerin fiyatları, vergiler dahil (KDV) Türk Lirası (TL) cinsinden ifade edilmiştir. Satıcı, teknik aksaklıklardan veya piyasa koşullarından kaynaklanan hatalı fiyatlandırmaları (sistem hatası nedeniyle 0 TL görünmesi vb.) iptal etme ve siparişi tek taraflı feshetme hakkını saklı tutar.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">3. Teslimat Koşulları</h2>
          <p>
            Sipariş onayından sonra ürünler, en geç 3 (üç) iş günü içerisinde anlaşmalı kargo şirketine teslim edilir. Ön siparişli veya stokta anlık olarak tükenen ürünlerde bu süre alıcıya bildirilerek uzatılabilir. Teslimat sırasında paketin hasarlı olması durumunda alıcının kargo yetkilisine tutanak tutturması zorunludur.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">4. Cayma Hakkı ve İade Politikası</h2>
          <p className="mb-2">
            Alıcı, 6502 sayılı Tüketicinin Korunması Hakkında Kanun gereği, ürünü teslim aldığı tarihten itibaren 14 (on dört) gün içerisinde hiçbir gerekçe göstermeksizin cayma hakkına sahiptir. Ancak teknoloji ürünlerinde iadenin kabul edilebilmesi için şu şartlar zorunludur:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Ürünün kutusunda, ambalajında veya garanti belgesinde yırtık/hasar olmamalıdır.</li>
            <li>Cep telefonu, bilgisayar ve akıllı saat gibi sim kart takılan veya Wi-Fi ağına bağlanan ürünlerde kurulum yapılmamış olmalıdır. Kurulumu yapılan cihazlar "ikinci el" statüsüne düştüğünden iadesi yasal olarak reddedilir.</li>
            <li>Kulaklık ve VR gözlük gibi hijyenik ürünlerin güvenlik bantları kesinlikle açılmamış olmalıdır.</li>
            <li>Ürün, tüm aksesuarları ve faturası ile birlikte eksiksiz iade edilmelidir.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">5. Garanti Kapsamı</h2>
          <p>
            Satılan tüm ürünler distribütör garantisi altındadır ve garanti süresi fatura tarihinden itibaren yasal olarak 2 (iki) yıldır. Kullanıcı hatasından (düşme, sıvı teması, yetkisiz müdahale vb.) kaynaklanan arızalar garanti kapsamı dışındadır.
          </p>
        </section>

        <section className="bg-gray-50 p-6 rounded-2xl border border-gray-100 mt-8">
          <h2 className="text-lg font-bold text-gray-900 mb-2">Uyuşmazlıkların Çözümü</h2>
          <p className="text-sm">
            İşbu sözleşmenin uygulanmasında doğabilecek uyuşmazlıklarda, T.C. Ticaret Bakanlığı'nca her yıl ilan edilen değere kadar alıcının yerleşim yerindeki Tüketici Hakem Heyetleri, söz konusu değerin üzerindeki ihtilaflarda ise Tüketici Mahkemeleri yetkilidir.
          </p>
        </section>
      </div>
    </div>
  );
}
