import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Veritabanı temizliği başlatılıyor...");

  // Ürünleri sil (Önce ürünler silinmeli ki, kategori ve markalar boşa çıksın)
  await prisma.product.deleteMany({});
  console.log("✅ Tüm ürünler silindi.");

  // Markaları ve Kategorileri sil
  await prisma.brand.deleteMany({});
  console.log("✅ Tüm markalar silindi.");
  
  await prisma.category.deleteMany({});
  console.log("✅ Tüm kategoriler silindi.");

  console.log("✨ Veritabanı tertemiz edildi! Artık sıfırdan başlayabilirsiniz.");
}

main()
  .catch((e) => {
    console.error("Temizlik sırasında hata:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });