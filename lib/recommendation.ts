import { prisma } from "@/lib/prisma";

export interface RecommendedProductDTO {
  id: string;
  name: string;
  price: number;
  comparePrice?: number | null;
  imageUrl: string;
  stock: number;
  category?: { name: string };
  reviews?: { rating: number }[];
}

/**
 * Enterprise Recommendation Engine Altyapısı
 * Gelecekte AI Recommendation, Collaborative Filtering ve Kişiselleştirilmiş Öneri motorlarıyla genişletilebilir.
 */
export async function getRelatedProducts(
  categoryId?: string | null,
  currentProductId?: string,
  limit: number = 6
): Promise<RecommendedProductDTO[]> {
  try {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        id: currentProductId ? { not: currentProductId } : undefined,
        categoryId: categoryId || undefined,
      },
      take: limit,
      orderBy: { salesCount: "desc" },
      select: {
        id: true,
        name: true,
        price: true,
        comparePrice: true,
        imageUrl: true,
        stock: true,
        category: { select: { name: true } },
        reviews: { select: { rating: true } },
      },
    });

    return products.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      comparePrice: p.comparePrice,
      imageUrl: p.imageUrl || "",
      stock: p.stock,
      category: p.category ?? undefined,
      reviews: p.reviews,
    }));
  } catch (error) {
    console.error("Recommendation Engine Error:", error);
    return [];
  }
}
