import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import ProductDetails from "@/components/ProductDetails";
import { Metadata } from "next";
import { getRelatedProducts } from "@/lib/recommendation";
import { getFrequentlyBoughtTogetherProducts } from "@/lib/recommendation-engine";
import FrequentlyBoughtTogetherSection from "@/components/product/FrequentlyBoughtTogetherSection";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  const product = await prisma.product.findUnique({
    where: { id },
    include: { images: true, category: true, brand: true },
  });

  if (!product) return { title: "Ürün Bulunamadı | Vitrin" };

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://vitrin.com";
  const title = `${product.name} En Uygun Fiyatla Satın Al | Vitrin`;
  const description = product.description?.substring(0, 160) || `${product.name} en uygun fiyatlarla Vitrin'de. Sınırlı stok, hızlı kargo ve güvenli ödeme fırsatını kaçırmayın.`;
  const imageUrl = product.images?.[0]?.imageUrl || product.imageUrl;

  return {
    title,
    description,
    alternates: {
      canonical: `${baseUrl}/products/${product.id}`,
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/products/${product.id}`,
      siteName: "Vitrin E-Ticaret",
      images: imageUrl ? [{ url: imageUrl, alt: product.name }] : [],
      locale: "tr_TR",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: imageUrl ? [imageUrl] : [],
    },
  };
}

export default async function SingleProductPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  const clerkUser = await currentUser();
  let isFavorite = false;

  const product = await prisma.product.findFirst({
    where: {
      id: id,
      isActive: true,
    },
    include: {
      images: true,
      category: true,
      brand: true,
      variants: {
        where: { isActive: true },
      },
      reviews: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!product) {
    return notFound();
  }

  if (clerkUser) {
    const email = clerkUser.emailAddresses[0]?.emailAddress;
    if (email) {
      const dbUser = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });
      if (dbUser) {
        const favoriteRecord = await prisma.favorite.findUnique({
          where: {
            userId_productId: {
              userId: dbUser.id,
              productId: product.id,
            },
          },
        });
        isFavorite = !!favoriteRecord;
      }
    }
  }

  // AI RECOMMENDATION ENGINE İLE BENZER VE BİRLİKTE ALINAN ÜRÜNLERİ PARALEL ÇEK
  const [relatedProducts, frequentlyBoughtProducts] = await Promise.all([
    getRelatedProducts(product.categoryId, product.id, 8),
    getFrequentlyBoughtTogetherProducts(product.id, 4),
  ]);

  const jsonLd = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: product.name,
    image: product.imageUrl ? [product.imageUrl] : [],
    description: product.description,
    sku: product.sku || product.id,
    brand: {
      "@type": "Brand",
      name: product.brand?.name || "Vitrin",
    },
    offers: {
      "@type": "Offer",
      url: `https://vitrin.com/products/${product.id}`,
      priceCurrency: "TRY",
      price: product.price,
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
    aggregateRating:
      product.reviews.length > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: (
              product.reviews.reduce((acc, curr) => acc + curr.rating, 0) / product.reviews.length
            ).toFixed(1),
            reviewCount: product.reviews.length,
          }
        : undefined,
  };

  return (
    <main className="min-h-screen bg-gray-50/30 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <ProductDetails
          product={{
            ...product,
            isFavorite,
          }}
          relatedProducts={relatedProducts}
        />
        
        {/* AI BİRLİKTE SIK SATIN ALINANLAR SEKSİYONU */}
        <FrequentlyBoughtTogetherSection products={frequentlyBoughtProducts} />
      </div>
    </main>
  );
}