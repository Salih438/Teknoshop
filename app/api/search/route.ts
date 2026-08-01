import { prisma } from "@/lib/prisma";
import { getMatchingCategoryIds } from "@/lib/synonyms";
import { NextResponse } from "next/server";
import { getClientIdentifier, checkRateLimit, rateLimitResponse } from "@/lib/rate-limiter";

export async function GET(request: Request) {
  try {
    const identifier = getClientIdentifier(request);
    const rateLimit = await checkRateLimit(identifier, { limit: 30, windowSeconds: 60 });
    if (!rateLimit.success) {
      return rateLimitResponse(rateLimit, "Çok fazla arama yaptınız. Lütfen 1 dakika bekleyip tekrar deneyin.");
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() || "";

    const trendingSearches = [
      "Kulaklık",
      "Laptop",
      "Klavye",
      "Monitör",
      "SSD",
      "Akıllı Saat",
      "Telefon",
      "Mouse",
    ];

    if (!q) {
      // Eğer arama kelimesi boşsa popüler ürünleri ve trend aramaları döndür
      const popularProducts = await prisma.product.findMany({
        where: { isActive: true },
        take: 5,
        orderBy: { salesCount: "desc" },
        select: {
          id: true,
          name: true,
          price: true,
          imageUrl: true,
          stock: true,
          category: { select: { name: true } },
        },
      });

      return NextResponse.json({
        products: popularProducts,
        categories: [],
        trendingSearches,
      });
    }

    // 1. Eş Anlamlı Kelimelerden Kategori ID'lerini Bul
    const matchedCategories = await getMatchingCategoryIds(q);
    const matchedCategoryIds = matchedCategories.map((c) => c.id);

    // 2. 🚀 PRISMA ESNEK SORGUSU (Name, Description, Category, Brand & Synonym Category IDs)
    const [matchingProducts, categoryResults] = await Promise.all([
      prisma.product.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
            { category: { name: { contains: q, mode: "insensitive" } } },
            { brand: { name: { contains: q, mode: "insensitive" } } },
            ...(matchedCategoryIds.length > 0 ? [{ categoryId: { in: matchedCategoryIds } }] : []),
          ],
        },
        take: 8,
        orderBy: { salesCount: "desc" },
        select: {
          id: true,
          name: true,
          price: true,
          comparePrice: true,
          imageUrl: true,
          stock: true,
          category: { select: { id: true, name: true } },
          brand: { select: { id: true, name: true } },
        },
      }),

      prisma.category.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            ...(matchedCategories.length > 0 ? [{ id: { in: matchedCategoryIds } }] : []),
          ],
        },
        take: 4,
        select: {
          id: true,
          name: true,
        },
      }),
    ]);

    return NextResponse.json({
      products: matchingProducts,
      categories: categoryResults,
      trendingSearches,
    });
  } catch (error) {
    console.error("Live Search API Error:", error);
    return NextResponse.json({ error: "Arama sırasında hata oluştu." }, { status: 500 });
  }
}
