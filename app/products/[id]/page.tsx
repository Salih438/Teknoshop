import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ProductDetails from "@/components/ProductDetails";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

// 🚀 1. EKLENTİ: DİNAMİK SEO VE LİNK PAYLAŞIM GÖRÜNÜMÜ (OpenGraph)
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  const product = await prisma.product.findUnique({
    where: { id },
    include: { images: true }
  });

  if (!product) return { title: "Ürün Bulunamadı | Vitrin" };

  return {
    title: `${product.name} | Vitrin`,
    description: product.description?.substring(0, 160) || `${product.name} en uygun fiyatlarla Vitrin'de.`,
    openGraph: {
      title: product.name,
      description: product.description?.substring(0, 160),
      images: product.images?.[0]?.imageUrl ? [product.images[0].imageUrl] : [],
    }
  };
}

export default async function SingleProductPage({ params }: { params: Promise<{ id: string }> }) {
  // URL'den ürünün ID'sini alıyoruz
  const resolvedParams = await params;
  const id = resolvedParams.id;

  // Prisma ile veritabanından ürünü çekiyoruz
  const product = await prisma.product.findFirst({
    where: { 
      id: id,
      isActive: true // Güvenlik: Pasif ürünler görüntülenemez
    },
    // 🚀 2. EKLENTİ: İlişkisel verileri genişlettik (Reviews eklendi)
    include: { 
      images: true, 
      category: true, 
      brand: true,
      reviews: {
        orderBy: { createdAt: 'desc' } // Yorumları en yeniden eskiye sıralayarak çek
      }
    }
  });

  // Ürün yoksa veya pasif durumdaysa 404 sayfasına yolla
  if (!product) {
    return notFound();
  }

  return (
    <main className="min-h-screen bg-gray-50/30 py-8">
      {/* Ürün bulunduysa tüm detaylarıyla birlikte Client Component'e yolluyoruz */}
      <ProductDetails product={product} />
    </main>
  );
}