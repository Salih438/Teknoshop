# 🛒 Teknoshop — Modern E-Ticaret Platformu

**Teknoshop**, modern web teknolojileri kullanılarak geliştirilmiş, kullanıcı tarafı ve yönetim panelini birlikte içeren full-stack bir e-ticaret platformudur.

Proje geliştirme sürecinde yalnızca kullanıcı arayüzüne değil; **veri bütünlüğü, kimlik doğrulama, rol tabanlı yetkilendirme, IDOR koruması, API güvenliği, rate limiting, veri doğrulama, responsive tasarım ve production deployment** gibi yazılım mühendisliği ve web güvenliği konularına da odaklanılmıştır.

> 🎓 Bu proje, Yazılım Mühendisliği staj sürecinde geliştirilmiş bir portföy ve eğitim projesidir.

---

## 🌐 Demo & Repository

| Kaynak       | Bağlantı                                                         |
| ------------ | ---------------------------------------------------------------- |
| 🚀 Live Demo | [Teknoshop'u ziyaret et](https://teknoshop-salih14.vercel.app/)  |
| 💻 GitHub    | [Repository'yi görüntüle](https://github.com/Salih438/Teknoshop) |

> **Not:** Production ortamındaki ödeme akışı demo/simülasyon amacıyla kullanılmaktadır ve gerçek para transferi gerçekleştirmemektedir.

---

# 🎯 Projenin Amacı

Bu projenin temel amacı, modern web teknolojileri kullanılarak gerçek bir e-ticaret sisteminde karşılaşılabilecek **kullanıcı, yönetim, veri yönetimi, güvenlik ve deployment ihtiyaçlarının uçtan uca uygulanmasıdır.**

Proje geliştirilirken özellikle:

* Ölçeklenebilir uygulama yapısı
* Type-safe veri erişimi
* Authentication ve Authorization
* Role-Based Access Control (RBAC)
* IDOR koruması
* API input validation
* Rate limiting
* Responsive kullanıcı deneyimi
* Production deployment

konularına odaklanılmıştır.

---

# 📸 Proje Önizlemesi

## 🏠 Ana Sayfa

<img width="1917" height="905" alt="Teknoshop Ana Sayfa" src="https://github.com/user-attachments/assets/71c31dd8-d55d-4530-a978-e9849b792986" />

---

## 📦 Ürün Detay Sayfası

<img width="1920" height="1080" alt="Teknoshop Ürün Detay Sayfası" src="https://github.com/user-attachments/assets/c5d67560-729d-42cb-991e-d8ff3ea2f19f" />

---

## 🛒 Sepet & Checkout

<img width="1920" height="1080" alt="Teknoshop Sepet ve Checkout" src="https://github.com/user-attachments/assets/1a962b62-3e7a-403a-a1f7-af2912fe3353" />

---

## ⚙️ Yönetim Paneli

<img width="1920" height="1080" alt="Teknoshop Admin Dashboard" src="https://github.com/user-attachments/assets/54aeead3-4e33-4066-9f4a-2d042da44074" />

---

# ✨ Özellikler

## 🛍️ Kullanıcı Tarafı

* Ürün listeleme ve detay görüntüleme
* Kategori ve marka bazlı filtreleme
* Ürün arama
* Fiyat ve sıralama seçenekleri
* Ürün varyasyonları
* Stok kontrolü
* Favoriler
* Ürün değerlendirmeleri
* Sepet yönetimi
* Adres yönetimi
* Sipariş oluşturma
* Sipariş geçmişi
* Sipariş detayları
* Kupon kullanımı
* Responsive kullanıcı arayüzü

---

# ⚙️ Yönetim Paneli

Yönetim paneli, sistemdeki temel e-ticaret operasyonlarının merkezi olarak yönetilmesini sağlar.

## 📦 Ürün Yönetimi

* Ürün oluşturma
* Ürün düzenleme
* Ürün silme
* Marka ve kategori yönetimi
* Ürün görsellerinin yönetimi
* SKU ve stok takibi
* Ürün varyasyonları
* Aktif/pasif ürün yönetimi

## 📋 Sipariş Yönetimi

* Sipariş listeleme
* Sipariş detaylarını görüntüleme
* Sipariş durumlarının yönetimi
* Sipariş iptali
* İptal edilen siparişlerde stok kontrolü

## 🧩 Diğer Yönetim Modülleri

* Kategori yönetimi
* Marka yönetimi
* Kupon yönetimi
* Kullanıcı yönetimi
* Sistem istatistikleri
* Yönetici erişim kontrolleri

---

# 🔐 Güvenlik

Projenin geliştirme sürecinde uygulama güvenliği temel gereksinimlerden biri olarak ele alınmıştır.

## 🔑 Authentication

Kullanıcı kimlik doğrulama işlemleri **Clerk** üzerinden gerçekleştirilmektedir.

## 👥 Role-Based Access Control (RBAC)

Yönetim paneli ve yönetici işlemlerinde **Role-Based Access Control (RBAC)** uygulanmıştır.

Kullanıcıların rollerine göre erişebileceği kaynaklar ve gerçekleştirebileceği işlemler sınırlandırılmıştır.

## 🛡️ IDOR Protection

Kullanıcı tarafından gönderilen kaynak ID'lerinin doğrudan güvenilir kabul edilmemesi için server-side sahiplik ve yetkilendirme kontrolleri uygulanmıştır.

Özellikle kullanıcıların başka kullanıcılara ait:

* Sipariş
* Adres
* Favori
* Profil verileri

gibi kaynaklara yetkisiz şekilde erişmesini önlemeye yönelik kontroller bulunmaktadır.

## ✅ API Validation

API girişlerinde **Zod** kullanılarak:

* Eksik alanlar
* Geçersiz veri tipleri
* Beklenmeyen değerler
* Geçersiz request body'leri

kontrol edilmektedir.

## 🚦 Rate Limiting

Kritik API endpointlerinde aşırı istekleri sınırlandırmak amacıyla **Rate Limiting** mekanizması uygulanmıştır.

## 🧱 Security Headers

Production ortamında aşağıdaki HTTP güvenlik başlıkları yapılandırılmıştır:

* Content-Security-Policy (CSP)
* X-Frame-Options
* Diğer yapılandırılmış HTTP security headers

## 🔒 Environment Variables

Veritabanı bağlantı bilgileri ve API anahtarları source code içerisinde tutulmamakta, environment variables üzerinden yönetilmektedir.

---

# 🏗️ Teknik Mimari

Proje **Next.js App Router** mimarisi üzerine kurulmuştur.

Genel mimari:

```text
                    ┌─────────────────────┐
                    │       Client        │
                    │   Desktop / Mobile  │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │      Next.js        │
                    │    App Router       │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
        UI / Server       Server Actions     API Routes
        Components                              │
                                               │
                                  ┌────────────┴────────────┐
                                  │ Authentication           │
                                  │ Authorization / RBAC     │
                                  │ Zod Validation           │
                                  │ Rate Limiting            │
                                  └────────────┬────────────┘
                                               │
                                               ▼
                                      ┌────────────────┐
                                      │   Prisma ORM   │
                                      └───────┬────────┘
                                              │
                                              ▼
                                      ┌────────────────┐
                                      │   PostgreSQL   │
                                      └────────────────┘
```

Frontend ve backend işlemleri aynı Next.js uygulaması içerisinde modüler şekilde yapılandırılmıştır.

---

# 🛠️ Teknoloji Stack

## Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS

## Backend

* Next.js Server Actions
* Next.js API Routes
* Node.js

## Database

* PostgreSQL
* Prisma ORM

## Authentication

* Clerk

## State Management

* Zustand

## Validation

* Zod

## Deployment

* Vercel

## Development Tools

* Git
* GitHub
* Prisma Studio
* VS Code

---

# 🗄️ Veri Tabanı

Veri erişimi **Prisma ORM** üzerinden gerçekleştirilmektedir.

PostgreSQL üzerinde kullanıcı, ürün, kategori, marka, sipariş, sepet, favoriler, adres, kupon ve ilgili ilişkileri yöneten ilişkisel bir veri modeli oluşturulmuştur.

Prisma sayesinde:

* Type-safe database queries
* Migration yönetimi
* İlişkisel veri erişimi
* Prisma Client
* Database schema yönetimi

sağlanmaktadır.

---

# 🚀 Local Development

## 1. Repository'yi klonlayın

```bash
git clone https://github.com/Salih438/Teknoshop.git
cd Teknoshop
```

## 2. Paketleri yükleyin

```bash
npm install
```

## 3. Environment Variables

Proje kök dizininde `.env.local` dosyası oluşturun.

Örnek:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require"

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="..."
CLERK_SECRET_KEY="..."

UPLOADTHING_SECRET="..."
UPLOADTHING_APP_ID="..."

NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Projede kullanılan diğer servis değişkenleri
# kendi hesaplarınızdaki değerlerle doldurulmalıdır.
```

> ⚠️ **Güvenlik:** Gerçek API anahtarlarını, database şifrelerini veya production secret değerlerini GitHub repository'sine yüklemeyin.

## 4. Prisma Client'ı oluşturun

```bash
npx prisma generate
```

## 5. Veritabanını hazırlayın

Projenin migration'larını uygulayın:

```bash
npx prisma migrate dev
```

> Projenin mevcut Prisma migration yapısı kullanılıyorsa bu yöntem tercih edilmelidir.

## 6. Development server'ı başlatın

```bash
npm run dev
```

Uygulama varsayılan olarak aşağıdaki adreste çalışır:

```text
http://localhost:3000
```

---

# 🧪 Quality & Production Checks

Production deployment öncesinde uygulamanın farklı katmanlarında çeşitli kontroller gerçekleştirilmiştir.

## TypeScript

```bash
npx tsc --noEmit
```

TypeScript tip kontrolleri gerçekleştirilmiştir.

## Production Build

```bash
npm run build
```

Production build işlemi başarılı şekilde tamamlanmıştır.

## Database

* Prisma schema kontrolü
* Database bağlantısı
* İlişkisel veri erişimi
* Migration yapısı

kontrol edilmiştir.

## Security

Aşağıdaki güvenlik mekanizmaları gözden geçirilmiştir:

* Authentication
* RBAC
* IDOR protection
* API validation
* Rate limiting
* Security headers

## End-to-End Kullanıcı Akışı

Temel kullanıcı akışları uçtan uca manuel olarak kontrol edilmiştir:

```text
Login
   ↓
Product
   ↓
Favorite
   ↓
Cart
   ↓
Address
   ↓
Checkout
   ↓
Order
   ↓
Order Detail
```

---

# 📱 Responsive Design

Uygulama masaüstü ve mobil ekranlar dikkate alınarak geliştirilmiştir.

Kontrol edilen başlıca alanlar:

* Navbar
* Search
* Product Cards
* Product Detail
* Cart
* Checkout
* Account
* Admin interfaces

Mobil cihazlarda dokunmatik etkileşimlerin kullanılabilirliği de gözden geçirilmiştir.

---

# ☁️ Deployment

Production deployment **Vercel** üzerinden gerçekleştirilmiştir.

Deployment sürecinde:

* Production environment variables
* PostgreSQL bağlantısı
* Prisma
* Authentication
* API endpointleri
* Production build

kontrol edilmiştir.

Production ortamındaki temel sayfalar ve kullanıcı akışları deployment sonrasında tekrar kontrol edilmiştir.

---

# ⚠️ Proje Kapsamı ve Sınırlamalar

Bu proje gerçek bir ticari mağaza olarak kullanılmak üzere değil, **full-stack web geliştirme, e-ticaret mimarisi, web güvenliği ve deployment süreçlerini uygulamalı olarak geliştirmek amacıyla** hazırlanmıştır.

Ödeme akışı demo/simülasyon amacıyla kullanılmaktadır ve gerçek finansal işlem gerçekleştirmek üzere tasarlanmamıştır.

Production ortamında gerçek kullanıcı verileri veya gerçek ödeme işlemleri kullanılmamalıdır.

---

# 🎯 Teknik Kazanımlar

Proje geliştirme sürecinde aşağıdaki alanlarda uygulamalı deneyim kazanılmıştır:

* Full-stack Web Development
* Next.js App Router
* React
* TypeScript
* REST API
* Server Actions
* PostgreSQL
* Prisma ORM
* Authentication
* Authorization
* RBAC
* IDOR Protection
* API Validation
* Rate Limiting
* Web Security
* Responsive UI Development
* Production Deployment
* Git / GitHub
* Database Design

---

# 👨‍💻 Developer

**Salih Balta**

Yazılım Mühendisliği Öğrencisi
Gümüşhane Üniversitesi

* GitHub: [Salih438](https://github.com/Salih438)
* LinkedIn: [Salih Balta](https://www.linkedin.com/in/salih-balta-68337b340/)

---

## ⭐ Projeyi Beğendiyseniz

Projeyi faydalı bulduysanız repository'ye ⭐ bırakabilirsiniz.
