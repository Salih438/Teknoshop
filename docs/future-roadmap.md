# 🚀 TeknoShop — Stratejik Gelecek Yol Haritası (Strategic Roadmap)

Bu doküman, TeknoShop'un 10x kullanıcı büyümesi ve kurumsal e-ticaret ölçeklenmesi için planlanan stratejik mimari iyileştirmelerin teknik yaklaşım notlarını içerir.

---

### 1. Merkezi Hata Takibi & APM (Sentry)
- **Teknik Yaklaşım:** Projeye `@sentry/nextjs` kütüphanesi entegre edilecek; `sentry.client.config.ts`, `sentry.server.config.ts` ve `sentry.edge.config.ts` yapılandırmalarıyla hem istemci tarafı JavaScript çökmeleri hem de API rotalarındaki 500 hataları anlık olarak yakalanacaktır. Mevcut 164+ dağınık `console.error` çağrısı `lib/logger.ts` altında toplanacak ve her HTTP isteğine `x-request-id` atanarak Sentry trace ve span'ları ile veritabanı sorguları ilişkilendirilecektir.

---

### 2. Dağıtık Yanıt & Durum Önbelleklemesi (Upstash Redis)
- **Teknik Yaklaşım:** `@upstash/redis` paketi ile serverless uyumlu HTTP Redis bağlantısı kurulacak; ana sayfa ve vitrin katalog sorguları (`/`, `/products`, `/categories`) için `unstable_cache` ve Redis key-value cache (`cache:products:featured`, `cache:categories:tree`) kullanılacaktır. Ürün güncelleme veya yeni sipariş durumunda `revalidateTag` veya Redis DEL ile cache invalidation sağlanarak veritabanı CPU yükü %80 azaltılacaktır.

---

### 3. Çoklu Sağlayıcı Ödeme Adaptör Mimarisi (Unified Payment Gateway Adapter)
- **Teknik Yaklaşım:** Hexagonal Architecture (Ports & Adapters) prensibiyle `IPaymentGatewayProvider` interface'i (`createPaymentSession`, `verifyPaymentCallback`, `processRefund`) tanımlanacak; mevcut simülasyon mantığı `MockPaymentAdapter` sınıfına taşınacaktır. Canlı ortam için `IyzicoPaymentAdapter` (`iyzipay`), `StripePaymentAdapter` (`stripe`) ve `PayTRPaymentAdapter` modülleri bu ortak arayüz üzerinden plug-and-play şeklinde sisteme bağlanacaktır.

---

### 4. Uçtan Uca Otomatik Test Hattı (Playwright CI/CD E2E)
- **Teknik Yaklaşım:** `@playwright/test` kurularak en kritik kullanıcı akışlarını (sepete ürün ekleme, kupon kodu uygulama, checkout formu doldurma ve sipariş tamamlama) test eden headless browser senaryoları yazılacaktır. GitHub Actions pipeline'ında her pull request açıldığında staging veritabanında seed çalıştırılıp E2E testleri otomatik koşturulacak, regresyonlar sıfıra indirilecektir.
