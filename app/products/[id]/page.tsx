import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ProductDetails from "@/components/ProductDetails";

export default async function SingleProductPage({ params }: { params: Promise<{ id: string }> }) {
  // 1. URL'den ürünün ID'sini alıyoruz
  const { id } = await params;

  // 2. Prisma ile veritabanından ürünü çekiyoruz
  const product = await prisma.product.findFirst({
    where: { 
      id: id,
      isActive: true // Linki bilse bile ürün pasifse 404'e düşer
    },
    // 3. EKSİK OLAN KISIM EKLENDİ: Resim, kategori ve marka bilgilerini çekiyoruz
    include: { 
      images: true, 
      category: true, 
      brand: true 
    }
  });

  // 4. Güvenlik Duvarı: Eğer ürün yoksa veya pasif durumdaysa 404 sayfasına yolla
  if (!product) {
    return notFound();
  }

  // 5. Ürün bulunduysa tüm detaylarıyla birlikte etkileşimli bileşenimize yolluyoruz
  return <ProductDetails product={product} />;
}