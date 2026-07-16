import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Veritabanı tohumlama (seeding) işlemi başlatılıyor...");
  console.log("Sadece Kategori ve Markalar ekleniyor...");

  // 1. KATEGORİ LİSTESİ
  const categories = [
    { name: "Akıllı Telefon", description: "En yeni akıllı telefon modelleri ve aksesuarları." },
    { name: "Dizüstü Bilgisayar", description: "İş, eğitim ve oyun için laptop modelleri." },
    { name: "Masaüstü Bilgisayar", description: "Yüksek performanslı masaüstü bilgisayarlar." },
    { name: "Tablet", description: "Eğlence ve üretkenlik için tablet seçenekleri." },
    { name: "Akıllı Saat", description: "Sağlık ve günlük kullanım için akıllı saatler." },
    { name: "Kulaklık", description: "Kablolu, kablosuz ve oyuncu kulaklıkları." },
    { name: "Monitör", description: "Oyun, ofis ve profesyonel monitörler." },
    { name: "Televizyon", description: "4K, OLED, QLED ve Smart TV modelleri." },
    { name: "Oyuncu Ekipmanları", description: "Klavye, mouse, gamepad ve oyuncu aksesuarları." },
    { name: "Bilgisayar Bileşenleri", description: "İşlemci, ekran kartı, RAM ve SSD ürünleri." },
    { name: "Depolama Ürünleri", description: "SSD, HDD, USB bellek ve hafıza kartları." },
    { name: "Ağ Ürünleri", description: "Modem, router, access point ve network ekipmanları." },
    { name: "Yazıcı ve Tarayıcı", description: "Ev ve ofis kullanımına uygun yazıcılar." },
    { name: "Kamera", description: "Fotoğraf makineleri ve aksiyon kameraları." },
    { name: "Ev Elektroniği", description: "Elektrikli süpürge, kahve makinesi vb." }
  ];

  // 2. MARKA LİSTESİ
  const brands = [
    "Apple", "Samsung", "Xiaomi", "ASUS", "Lenovo", "HP", "Dell", "Acer", "MSI",
    "LG", "Sony", "JBL", "Logitech", "Intel", "AMD", "NVIDIA", "Kingston",
    "Corsair", "WD", "Canon"
  ];

  // 3. TOPLU EKLEME İŞLEMİ (Bulk Insert)
  console.log("Kategoriler ekleniyor...");
  await prisma.category.createMany({
    data: categories,
    skipDuplicates: true, // Eğer aynı isimde kategori zaten varsa hata verme, es geç
  });

  console.log("Markalar ekleniyor...");
  await prisma.brand.createMany({
    data: brands.map(name => ({ name })), // String dizisini Prisma'nın istediği { name: "Apple" } formatına çevirir
    skipDuplicates: true,
  });

  console.log("✅ Tohumlama başarıyla tamamlandı! 15 Kategori ve 20 Marka mağazaya eklendi.");
}

main()
  .catch((e) => {
    console.error("Tohumlama sırasında bir hata oluştu:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });