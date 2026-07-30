import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hakkımızda | E-Ticaret Teknoloji",
  description: "Türkiye'nin en yenilikçi teknoloji e-ticaret platformu hakkında bilgi edinin.",
};

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-4">Hakkımızda</h1>
        <div className="w-24 h-1 bg-blue-600 mx-auto rounded"></div>
      </div>

      <div className="space-y-8 text-gray-600 leading-relaxed text-lg">
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Biz Kimiz?</h2>
          <p>
            Teknolojinin hızla geliştiği modern dünyada, en yeni donanım ve yazılım ürünlerini tüketicilerle en hızlı ve güvenli şekilde buluşturmayı hedefleyen öncü bir e-ticaret platformuyuz. Müşterilerimize sadece bir ürün değil, kesintisiz bir dijital deneyim sunmak için yola çıktık.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Vizyonumuz</h2>
          <p>
            Türkiye'de teknoloji alışverişi denildiğinde akla gelen ilk marka olmak. Güçlü tedarik zincirimiz, yenilikçi web altyapımız ve müşteri odaklı hizmet anlayışımızla teknoloji perakendeciliğinde standartları yeniden belirliyoruz. Geleceğin teknolojilerini bugünden erişilebilir kılıyoruz.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Misyonumuz</h2>
          <p>
            En karmaşık teknolojik ürünleri bile herkes için anlaşılabilir ve kolay ulaşılabilir hale getirmek. Kullanıcı dostu arayüzümüz, yapay zeka destekli altyapımız ve kişiselleştirilmiş alışveriş deneyimimiz sayesinde her bir müşterimizin ihtiyacına en uygun çözümü bulmasını sağlıyoruz. 
          </p>
        </section>

        <section className="bg-gray-50 p-6 rounded-2xl border border-gray-100 mt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Neden Bizi Seçmelisiniz?</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>%100 Orijinal Ürün Garantisi:</strong> Tüm ürünlerimiz doğrudan yetkili distribütörlerden tedarik edilmektedir.</li>
            <li><strong>Hızlı ve Güvenli Teslimat:</strong> Güçlü lojistik ağımız sayesinde siparişleriniz aynı gün kargoda.</li>
            <li><strong>Gelişmiş Güvenlik:</strong> 256-bit SSL şifreleme ve modern altyapımız ile verileriniz her zaman güvende.</li>
            <li><strong>7/24 Müşteri Desteği:</strong> Satış öncesi ve sonrası tüm sorularınız için uzman ekibimiz her an yanınızda.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
