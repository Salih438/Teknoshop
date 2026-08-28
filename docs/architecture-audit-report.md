# 🔐 TeknoShop — Sistem Mimarisi, UI ve Kimlik Doğrulama Denetim Raporu

> **Denetim Türü:** Kök Neden Analizi (Read-Only Architecture Audit)  
> **Tarih:** 2026-08-28  
> **Denetçi:** Antigravity (Full-Stack & Security Architecture AI)  
> **Kapsam:** 5 Katman — Auth Mimarisi, Auth UI, UI Mantık, Sistem Mimarisi, Kayıt Akışı  
> **Önceki Raporlar:** docs/feature-gap-report.md (gap analizi) ile çakışan bulgular tekrar edilmemiştir.

---

## Yönetici Özeti

TeknoShop genel anlamda güvenli bir kimlik doğrulama mimarisine sahiptir. Admin paneli sunucu tarafında requireAdmin() + layout-level RBAC ile çift katmanlı korunmaktadır. Sipariş/adres/favori gibi kullanıcıya özgü verilerde IDOR korumaları gerçek kodda doğrulanmıştır. Kritik ödeme ve stok işlemleri Prisma ACID transaction ile atomik olarak gerçekleşmektedir. Ancak 5 yapısal risk ve 11 orta/düşük öncelikli bulgu tespit edilmiştir.

### Skor Tablosu

| Seviye | Bulgu Sayısı | Açıklama |
|--------|:---:|---|
| P1 Kritik | 2 | Derhal müdahale gerektirir |
| P2 Orta | 5 | Bir sonraki sprintte çözülmeli |
| P3 Düşük | 5 | Teknik borç — planlanmalı |
| **Toplam** | **12** | |

### Olgunluk Skoru: 76 / 100

> **Gerekçe:** Admin güvenliği, IDOR korumaları, ACID checkout ve rate limiting en yüksek standartlarda. Skoru düşüren başlıca etkenler: systemRole DB default riski (P1), middleware'in /profile ve /checkout rotalarını kapsamaması (P1), in-memory rate limiter'ın çok sunuculu ortamlarda etkisizliği (P2), checkout sayfasının "use client" olarak çalışması (P2), ve AuthCartSync'teki oturum değişim yarışma koşulu (P2).

---

## KATMAN 1 — Kimlik Doğrulama Mimarisi

### BUL-01 (P1 KRITİK) — Middleware Sadece /admin Rotalarını Koruyor

**Dosya:** middleware.ts:4
```ts
const isProtectedRoute = createRouteMatcher(['/admin(.*)']);
```
**Kök Neden:** /profile/*, /checkout, /order-success gibi rotalar middleware katmanına dahil değildir. Checkout sayfası tamamen "use client" + useAuth() ile çalışmaktadır — sunucu tarafında hiçbir koruma yoktur.

**Senaryo:** JavaScript devre dışıyken (bot, tarayıcı sorunları) checkout sayfasında auth kontrolü yapılmaz. /api/checkout sunucu tarafında currentUser() kontrolü yaptığı için gerçek sipariş oluşturulamaz — pratik exploit riski düşük, ancak mimari tutarsızlık mevcuttur.

**Düzeltme Önerisi (Uygulamayın — sadece öneri):**
```ts
const isProtectedRoute = createRouteMatcher([
  '/admin(.*)',
  '/profile(.*)',
  '/checkout',
  '/order-success',
]);
```

---

### BUL-02 (P1 KRİTİK) — systemRole Alanı DB Schemada @default(ADMIN) Tanımlı

**Dosya:** prisma/schema.prisma:164
```prisma
systemRole SystemRole @default(ADMIN)
```
**Kök Neden:** Yeni kayıt olan her kullanıcı DB'de ADMIN systemRole ile başlar. role alanı USER olduğundan admin paneline giriş engellenir. Ancak gelecekte sadece systemRole kontrolü yapan bir kod yazılırsa tüm kullanıcılar ADMIN systemRolüne sahip olacaktır.

**Gerçek Tehdit:** checkPermission() fonksiyonu rbac.ts:102-103 içinde role !== "ADMIN" kontrolü yapmaktadır; bu şu an için koruyucudur. Ancak isim karışıklığı ve yanlış default değer teknik borç oluşturmaktadır.

**Düzeltme Önerisi:** systemRole SystemRole? (opsiyonel, null) veya default olarak ANALYST atanmalıdır.

---

### BUL-03 (P2 ORTA) — Oturum Kapatma Sonrası Zustand Sepet Temizleme Yarışma Koşulu

**Dosya:** components/AuthCartSync.tsx:48-54

clearCart() çağrılırken aktif debounceTimer iptal edilmemektedir. 1 saniye gecikme ile gönderilecek cart sync isteği oturum kapansa da tetiklenebilir.

**Etki:** Teorik olarak oturumu kapanan kullanıcının son sepet verisi DB'de kalabilir.

---

### BUL-04 (P2 ORTA) — Admin Sayfalarında İki Farklı Auth Kontrol Mekanizması

- admin/products/page.tsx:21 → checkIsAdmin() (izin parametresi almaz)
- admin/page.tsx:22 → requireAdmin("VIEW_DASHBOARD") (granular izin)
- admin/users/page.tsx:42 → requireAdmin("MANAGE_USERS") (granular izin)

**Kök Neden:** checkIsAdmin() sadece role === "ADMIN" kontrolü yapar, systemRole ve granular RBAC'i denetlemez. CONTENT_MANAGER rolündeki bir admin /admin/products sayfasına erişebilir.

---

### BUL-05 (P3 DÜŞÜK) — In-Memory Rate Limiter Çok Sunuculu Ortamlarda Etkisiz

**Dosya:** lib/rate-limiter.ts:22

```ts
const memoryCache = new Map<string, MemoryBucket>();
```
Serverless (Vercel) ortamında her compute instance ayrı Map kullanır. UPSTASH_REDIS_REST_URL konfigüre edilmemişse rate limiting tamamen etkisizdir.

---

## KATMAN 2 — Kimlik Doğrulama UI Durumları

### BUL-06 (P2 ORTA) — Checkout Sayfası Flash of Content Riski

**Dosya:** app/(storefront)/checkout/page.tsx:217-250

Skeleton loader → isLoaded true → içerik pattern nedeniyle yavaş bağlantılarda form bir an görünüp sonra "giriş yapın" ekranına geçebilir. BUL-01 ile birlikte değerlendirilmelidir.

---

### BUL-07 (P3 DÜŞÜK) — Checkout Session Expire Sonrası Graceful Degradation Eksikliği

Kullanıcı checkout dolduruken oturumu süresi dolarsa, form gönderiminde 401 alınır ve sadece genel hata toast'ı gösterilir. "Oturumunuz sona erdi, lütfen giriş yapın" gibi yönlendirici bir mesaj verilmemektedir.

---

### BUL-08 (P3 DÜŞÜK) — Login Sonrası Redirect: Kullanıcı Her Zaman Ana Sayfaya Atılabilir

Clerk dashboard'unda afterSignInUrl konfigüre edilmemişse, kullanıcı /checkout'tan çıkıp giriş yapınca ana sayfaya yönlendirilir; checkout sayfasına dönmez.

---

## KATMAN 3 — UI Mantık Hataları

### BUL-09 (P2 ORTA) — Checkout Sayfası Tamamen Client Component

**Dosya:** app/(storefront)/checkout/page.tsx:1

```tsx
"use client";
```
Adresler, ödeme yöntemleri ve mağaza ayarları useEffect + fetch() ile ayrı ayrı çekilmektedir (3 paralel istek). Yavaş mobil ağlarda 2-3 saniyelik skeleton + 3 ek API çağrısı görünür.

**Düzeltme Önerisi:** Adresler ve ödeme yöntemleri sunucu tarafında Prisma ile çekilmeli, sadece etkileşimli kısımlar Client Component olmalıdır.

---

### BUL-10 (P3 DÜŞÜK) — ProfileStats Bileşeni Gereksiz "use client" Direktifi

**Dosya:** components/profile/ProfileStats.tsx:1

Sadece sayısal prop'ları render eden bu bileşen hiçbir browser API, useState veya useEffect kullanmamaktadır. OrderTimeline için de aynı durum geçerlidir.

---

### BUL-11 (P2 ORTA) — Admin Ürünler/Kullanıcılar Sayfası: take: 300 Hard Limit, Sayfalama Yok

**Dosya:** admin/products/page.tsx:98, admin/users/page.tsx:112

300+ kayıtta veriler kesilir. Sayfalama veya cursor-based pagination yoktur.

---

## KATMAN 4 — Sistem Mimarisi Tutarlılığı

### BUL-12 (P3 DÜŞÜK) — Admin Kullanıcılar Listesi: orders take Sınırı Yok

**Dosya:** admin/users/page.tsx:98-113

Yoğun siparişçisi olan kullanıcılarda (500+ sipariş) tek sorgu aşırı yük oluşturabilir.

**Öneri:** orders: { take: 5, orderBy: { createdAt: 'desc' } }

---

### BUL-13 (P3 DÜŞÜK) — app/error.tsx Global-Error Değil Standart Error Boundary

**Dosya:** app/error.tsx:6

Next.js'de root layout hatalarını yakalamak için app/global-error.tsx gereklidir. Mevcut app/error.tsx sadece root layout'un çocuklarındaki hataları yakalar. ClerkProvider init hatası beyaz ekrana yol açar.

---

## KATMAN 5 — Kayıt Akışı

Kayıt akışı tamamen Clerk tarafından yönetilmektedir. Email doğrulaması enforce edilmektedir. Aynı email ile ikinci kayıt Clerk tarafından reddedilir. prisma.user.upsert() pattern'i temiz ve güvenilirdir.

### BUL-14 (P2 ORTA) — AuthCartSync Her Sayfa Yenilenmesinde DB Write Tetikliyor

**Dosya:** components/AuthCartSync.tsx:9

```tsx
const wasSignedIn = useRef(isSignedIn);
```
İlk mount'ta Clerk henüz yüklenmemişken isSignedIn false başlar; yüklenince true'ya geçer ve her sayfa yenilenmesinde DB cart merge + write tetiklenir.

**Düzeltme Önerisi:** Merge yalnızca gerçek giriş eyleminde tetiklenmeli; periyodik sayfa yenilenmelerinde gereksiz DB yazma önlenmelidir.

---

## Öncelik Sıralı Düzeltme Yol Haritası

| Öncelik | Bulgu | Etki | Efor |
|:---:|---|---|:---:|
| P1 | BUL-02: systemRole @default(ADMIN) | Olası ayrıcalık riski | XS |
| P1 | BUL-01: Middleware /profile//checkout kapsamaması | Mimari tutarsızlık | XS |
| P2 | BUL-09: Checkout Client Component | Yavaş mobil performans | M |
| P2 | BUL-11: Admin take: 300 hard limit | Veri kesikliği | S |
| P2 | BUL-04: checkIsAdmin() vs requireAdmin() tutarsızlığı | RBAC prensibi ihlali | XS |
| P2 | BUL-14: AuthCartSync gereksiz DB write | DB yükü | S |
| P2 | BUL-03: Sepet sync race condition | Düşük risk | XS |
| P3 | BUL-05: In-memory rate limiter | Çok instance'da etkisiz | S |
| P3 | BUL-10: ProfileStats gereksiz use client | Bundle büyümesi | XS |
| P3 | BUL-12: Admin users orders take sınırsız | Potansiyel yavaşlık | XS |
| P3 | BUL-13: app/error.tsx global-error değil | Root hatası yakalanmaz | XS |
| P3 | BUL-07: Checkout session expire UX | UX sorunu | S |

> Efor: XS = <1 saat, S = 1-4 saat, M = yarım gün

---

## Sonuç

TeknoShop kimlik doğrulama mimarisi temel güvenlik standartlarını karşılamakta ve IDOR korumaları gerçek kodla doğrulanmıştır. İki P1 bulgu (systemRole default ve middleware kapsamı) güvenlik açıklarından ziyade mimari teknik borçtur. En yüksek pratik değeri checkout sunucu bileşenine dönüştürme (BUL-09) ve admin sayfalarda sayfalama (BUL-11) sağlayacaktır.
