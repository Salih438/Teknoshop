import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ProductDetails from "@/components/ProductDetails";

export default async function SingleProductPage({ params }: { params: Promise<{ id: string }> }) {
  // 1. URL'den ürünün ID'sini alıyoruz
  const { id } = await params;

  // 2. Prisma ile veritabanından ürünü çekiyoruz (AKTİFLİK KONTROLÜ İLE)
  const product = await prisma.product.findFirst({
    where: { 
      id: id,
      isActive: true // EN KRİTİK GÜNCELLEME: Linki bilse bile ürün pasifse veritabanından çekilmez!
    },
    // Eğer resim vb. ilişkili tabloların varsa (schema'na göre) buraya include ekleyebilirsin
    // include: { images: true, category: true, brand: true }
  });

  // 3. Güvenlik Duvarı: Eğer ürün yoksa VEYA ürün pasif durumdaysa doğrudan 404 sayfasına yolla
  if (!product) {
    return notFound();
  }

  // 4. Ürün bulunduysa ve aktifse, veriyi etkileşimli bileşenimize yolluyoruz
  return <ProductDetails product={product} />;
}