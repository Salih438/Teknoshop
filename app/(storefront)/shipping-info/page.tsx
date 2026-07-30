import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kargo ve Teslimat | Antigravity E-Ticaret",
  description: "Antigravity E-Ticaret kargo ve teslimat süreçleri, ücretler ve kargo firmaları.",
};

export default function ShippingInfoPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white p-8 md:p-12 rounded-3xl border border-gray-100 shadow-sm">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">Kargo ve Teslimat Bilgileri</h1>
            <p className="text-gray-500 text-lg">Siparişlerinizin size en hızlı ve güvenli şekilde ulaşması için bilmeniz gerekenler.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Gönderim Süresi</h3>
              <p className="text-gray-700">Saat 15:00'e kadar verilen siparişleriniz aynı gün kargoya teslim edilmektedir. Kampanya dönemlerinde kargoya verilme süresi 1-2 iş günü olabilir.</p>
            </div>
            
            <div className="bg-green-50 p-6 rounded-2xl border border-green-100">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Ücretsiz Kargo</h3>
              <p className="text-gray-700">Belirli bir tutarın üzerindeki tüm siparişlerinizde Türkiye'nin her yerine ücretsiz kargo avantajından faydalanabilirsiniz.</p>
            </div>
          </div>

          <div className="prose prose-blue prose-lg max-w-none text-gray-700">
            <h3>Çalıştığımız Kargo Firmaları</h3>
            <p>
              Müşterilerimize en iyi hizmeti sunabilmek adına Türkiye'nin önde gelen kargo firmaları ile çalışıyoruz:
            </p>
            <ul>
              <li><strong>Yurtiçi Kargo:</strong> Tüm Türkiye geneline standart teslimat.</li>
              <li><strong>Aras Kargo:</strong> Tüm Türkiye geneline standart teslimat.</li>
              <li><strong>Hepsijet:</strong> İstanbul, Ankara ve İzmir gibi büyükşehirlerde ertesi gün teslimat seçeneği.</li>
            </ul>
            <p>Sipariş tamamlama aşamasında bölgenize hizmet veren kargo firmalarından dilediğinizi seçebilirsiniz.</p>

            <h3>Sipariş Takibi</h3>
            <p>
              Siparişiniz kargoya teslim edildiğinde, size bir bilgilendirme e-postası ve SMS gönderilir. Bu mesajda yer alan kargo takip numarası ile kargonuzun nerede olduğunu anlık olarak takip edebilirsiniz. Ayrıca hesabınıza giriş yaparak <strong>Siparişlerim</strong> sayfasından da takip linkine ulaşabilirsiniz.
            </p>

            <h3>Teslimat Sırasında Dikkat Edilmesi Gerekenler</h3>
            <p>Kargonuz size ulaştığında aşağıdaki adımlara dikkat etmeniz büyük önem taşımaktadır:</p>
            <ul>
              <li>Kargo paketini teslim almadan önce dış ambalajında herhangi bir yırtık, ezilme veya ıslanma olup olmadığını kontrol edin.</li>
              <li>Eğer pakette bir hasar varsa, kargo görevlisine "Hasar Tespit Tutanağı" tutturun ve paketi teslim almayın.</li>
              <li>Tutanak tutulan hasarlı kargolar firmamıza geri dönecek ve size hemen yeni ürün gönderimi yapılacaktır.</li>
              <li>Teslimat sonrasında fark edilen kırık veya eksik ürünlerde, kargo firmaları sorumluluk kabul etmediği için tutanak tutulması şarttır.</li>
            </ul>

            <h3>Adreste Bulunmama Durumu</h3>
            <p>
              Kargo görevlisi adresinize geldiğinde sizi bulamazsa, kargonuz en yakın şubeye bırakılır ve size SMS ile bilgi verilir. Şubeye bırakılan kargonuzu <strong>3 iş günü</strong> içerisinde kimliğiniz ile teslim almanız gerekmektedir. Alınmayan kargolar firmamıza iade edilir.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
