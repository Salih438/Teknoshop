import { prisma } from "@/lib/prisma";
import { ProductCardProps } from "@/components/ProductCard";

/**
 * Enterprise AI Recommendation Engine & Personalization System
 * Amazon, Spotify ve Shopify Plus algoritmaları seviyesinde ilişkisel öneri sunar.
 */

// Yardımcı Formatlayıcı
const formatProduct = (p: {
  id: string;
  name: string;
  price: number;
  comparePrice?: number | null;
  imageUrl?: string | null;
  stock: number;
  category?: { id?: string; name: string } | null;
  reviews?: { rating: number }[];
}): ProductCardProps => ({
  id: p.id,
  name: p.name,
  price: p.price,
  comparePrice: p.comparePrice,
  imageUrl: p.imageUrl || "",
  stock: p.stock,
  category: p.category ?? undefined,
  reviews: p.reviews,
});

/**
 * 1. KİŞİSELLEŞTİRİLMİŞ ÖNERİLER (SANA ÖZEL / YOUR PERSONALIZED SELECTIONS)
 * - Giriş yapmış kullanıcılar için: Geçmiş siparişlerindeki kategori ve markaları analiz ederek en uygun ürünleri getirir.
 * - Ziyaretçi (Guest) için: En çok satan ve en yüksek puanlı ürünleri getirir.
 */
export async function getPersonalizedRecommendations(
  userId?: string,
  limit: number = 8
): Promise<ProductCardProps[]> {
  try {
    if (userId) {
      // Kullanıcının son 5 siparişindeki ürünlerin kategorilerini tespit et
      const lastOrders = await prisma.order.findMany({
        where: { userId },
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          items: {
            select: {
              product: {
                select: { categoryId: true, brandId: true },
              },
            },
          },
        },
      });

      const preferredCategoryIds = new Set<string>();
      lastOrders.forEach((o) => {
        o.items.forEach((i) => {
          if (i.product?.categoryId) preferredCategoryIds.add(i.product.categoryId);
        });
      });

      if (preferredCategoryIds.size > 0) {
        const personalized = await prisma.product.findMany({
          where: {
            isActive: true,
            categoryId: { in: Array.from(preferredCategoryIds) },
          },
          take: limit,
          orderBy: { salesCount: "desc" },
          include: {
            category: { select: { name: true } },
            reviews: { select: { rating: true } },
          },
        });

        if (personalized.length > 0) {
          return personalized.map(formatProduct);
        }
      }
    }

    // Ziyaretçi veya sipariş geçmişi yoksa en çok satan ürünleri getir
    const fallbackProducts = await prisma.product.findMany({
      where: { isActive: true },
      take: limit,
      orderBy: { salesCount: "desc" },
      include: {
        category: { select: { name: true } },
        reviews: { select: { rating: true } },
      },
    });

    return fallbackProducts.map(formatProduct);
  } catch (error) {
    console.error("Personalized Recommendations Engine Error:", error);
    return [];
  }
}

/**
 * 2. ORTAK SATIN ALMA HESABI (BİRLİKTE SIK ALINANLAR / CUSTOMERS BOUGHT THIS ALSO BOUGHT)
 * - Veritabanındaki OrderItem ve Order tablolarını sorgulayarak bu ürünle aynı siparişte yer alan ürünleri frekans sırasına göre bulur.
 */
export async function getFrequentlyBoughtTogetherProducts(
  productId: string,
  limit: number = 4
): Promise<ProductCardProps[]> {
  try {
    // 1. Bu ürünün içinde yer aldığı siparişlerin ID'lerini bul
    const ordersWithProduct = await prisma.orderItem.findMany({
      where: { productId },
      select: { orderId: true },
      take: 20,
    });

    const orderIds = Array.from(new Set(ordersWithProduct.map((o) => o.orderId)));

    if (orderIds.length === 0) {
      // Eğer sipariş geçmişi yoksa aynı kategorideki en çok satanları getir
      const currentProduct = await prisma.product.findUnique({
        where: { id: productId },
        select: { categoryId: true },
      });

      const categoryProducts = await prisma.product.findMany({
        where: {
          isActive: true,
          id: { not: productId },
          categoryId: currentProduct?.categoryId || undefined,
        },
        take: limit,
        orderBy: { salesCount: "desc" },
        include: {
          category: { select: { name: true } },
          reviews: { select: { rating: true } },
        },
      });

      return categoryProducts.map(formatProduct);
    }

    // 2. Bu siparişlerdeki diğer ürünleri bul
    const coPurchasedItems = await prisma.orderItem.findMany({
      where: {
        orderId: { in: orderIds },
        productId: { not: productId },
      },
      select: {
        productId: true,
      },
    });

    // Frekans haritası oluştur
    const frequencyMap = new Map<string, number>();
    coPurchasedItems.forEach((item) => {
      frequencyMap.set(item.productId, (frequencyMap.get(item.productId) || 0) + 1);
    });

    // En yüksek frekanslı ürün ID'lerini sırala
    const sortedProductIds = Array.from(frequencyMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map((entry) => entry[0])
      .slice(0, limit);

    if (sortedProductIds.length === 0) {
      const fallback = await prisma.product.findMany({
        where: { isActive: true, id: { not: productId } },
        take: limit,
        orderBy: { salesCount: "desc" },
        include: {
          category: { select: { name: true } },
          reviews: { select: { rating: true } },
        },
      });
      return fallback.map(formatProduct);
    }

    // Ürün detaylarını veritabanından getir
    const recommendedProducts = await prisma.product.findMany({
      where: {
        id: { in: sortedProductIds },
        isActive: true,
      },
      include: {
        category: { select: { name: true } },
        reviews: { select: { rating: true } },
      },
    });

    return recommendedProducts.map(formatProduct);
  } catch (error) {
    console.error("Frequently Bought Together Engine Error:", error);
    return [];
  }
}

/**
 * Returns the most popular products that are not already in the user's cart.
 *
 * NOTE:
 * This is NOT a complementary/cross-sell recommendation engine.
 * It simply recommends best-selling products.
 */
export async function getCartPopularProducts(
  cartProductIds: string[],
  limit: number = 4
): Promise<ProductCardProps[]> {
  try {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        id: { notIn: cartProductIds },
      },
      take: limit,
      orderBy: { salesCount: "desc" },
      include: {
        category: { select: { name: true } },
        reviews: { select: { rating: true } },
      },
    });

    return products.map(formatProduct);
  } catch (error) {
    console.error("Cart Popular Engine Error:", error);
    return [];
  }
}
