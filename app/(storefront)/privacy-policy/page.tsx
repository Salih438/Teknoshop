import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gizlilik Politikası | E-Ticaret Teknoloji",
  description: "Kişisel verilerinizin işlenmesi ve korunmasına yönelik gizlilik politikamız.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-4">Gizlilik Politikası</h1>
        <div className="w-24 h-1 bg-blue-600 mx-auto rounded"></div>
      </div>

      <div className="space-y-8 text-gray-600 leading-relaxed text-base">
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">1. Veri Sorumlusu ve Amacımız</h2>
          <p>
            6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca, E-Ticaret Teknoloji A.Ş. olarak, veri sorumlusu sıfatıyla kişisel verilerinizi yasalara uygun olarak işlemekte ve korumaktayız. Amacımız, sitemiz üzerinden yaptığınız alışverişlerin güvenli bir şekilde tamamlanması ve sizlere daha iyi bir hizmet sunulmasıdır.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">2. İşlenen Kişisel Veriler</h2>
          <p className="mb-2">Platformumuzu kullanımınız sırasında aşağıdaki verileriniz işlenebilmektedir:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Kimlik Bilgileri:</strong> Ad, soyad, T.C. kimlik numarası (fatura kesimi için yasal zorunluluk gereği).</li>
            <li><strong>İletişim Bilgileri:</strong> E-posta adresi, telefon numarası, fatura ve teslimat adresleri.</li>
            <li><strong>Müşteri İşlem Bilgileri:</strong> Sipariş geçmişi, sepet bilgileri, IP adresi ve cihaz bilgileri.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">3. Kişisel Verilerin İşlenme Amaçları</h2>
          <p className="mb-2">Toplanan kişisel verileriniz aşağıdaki amaçlarla işlenmektedir:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Mesafeli satış sözleşmesinin kurulması ve ifası.</li>
            <li>Satın alınan ürünlerin teslimatının kargo firmaları aracılığıyla sağlanması.</li>
            <li>Finans ve muhasebe işlerinin yürütülmesi (fatura düzenlenmesi).</li>
            <li>Yasal yükümlülüklerin yerine getirilmesi ve olası uyuşmazlıklarda delil olarak kullanılması.</li>
            <li>Açık rızanız olması halinde kampanya ve promosyon bilgilendirmelerinin yapılması.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">4. Kişisel Verilerin Aktarımı</h2>
          <p>
            Kişisel verileriniz, yasal düzenlemelerin izin verdiği sınırlar dahilinde; sipariş teslimatı için kargo firmalarıyla, ödeme işlemlerinin gerçekleşmesi için BDDK lisanslı ödeme kuruluşlarıyla ve yasal zorunluluklar gereği yetkili kamu kurumlarıyla paylaşılabilmektedir. Üçüncü şahıslara reklam amaçlı veri satışı kesinlikle yapılmamaktadır.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">5. Veri Güvenliği</h2>
          <p>
            Sistemlerimiz 256-bit SSL sertifikaları ile şifrelenmekte olup, uluslararası güvenlik standartlarına (PCI-DSS) tam uyumluluk göstermektedir. Kredi kartı bilgileriniz sunucularımızda saklanmaz, doğrudan güvenli ödeme altyapısına iletilir.
          </p>
        </section>

        <section className="bg-gray-50 p-6 rounded-2xl border border-gray-100 mt-8">
          <h2 className="text-lg font-bold text-gray-900 mb-2">Haklarınız ve İletişim</h2>
          <p className="text-sm">
            KVKK'nın 11. maddesi kapsamında kişisel verilerinizin silinmesini, düzeltilmesini veya işlenip işlenmediğini öğrenme hakkına sahipsiniz. Taleplerinizi <strong>kisiselveri@eticaret-teknoloji.com</strong> adresi üzerinden veri sorumlusu yetkilimize iletebilirsiniz.
          </p>
          <p className="text-xs text-gray-400 mt-4">Son Güncelleme Tarihi: {new Date().toLocaleDateString('tr-TR')}</p>
        </section>
      </div>
    </div>
  );
}
