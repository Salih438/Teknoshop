import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ProductDetails from "@/components/ProductDetails";

// Next.js 15: Dinamik rotalar (params) Promise olarak beklenir
export default async function SingleProductPage({ params }: { params: Promise<{ id: string }> }) {
  // 1. URL'den ürünün ID'sini alıyoruz
  const { id } = await params;

  // 2. Prisma ile veritabanından spesifik ürünü çekiyoruz
  const product = await prisma.product.findUnique({
    where: { 
      id: id 
    },
  });

  // 3. Güvenlik Duvarı: Eğer URL'deki ID'ye ait ürün yoksa (veya silindiyse) 404'e atıyoruz
  if (!product) {
    return notFound();
  }

  // 4. Ürün bulunduysa, veriyi o devasa etkileşimli bileşenimize (Client Component) yolluyoruz
  return <ProductDetails product={product} />;
}