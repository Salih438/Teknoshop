import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
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

    // 🚀 CANLI ARAMA SORGULARI (Promise.all ile Paralel Performans)
    const [matchingProducts, matchingCategories] = await Promise.all([
      prisma.product.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
            { category: { name: { contains: q, mode: "insensitive" } } },
            { brand: { name: { contains: q, mode: "insensitive" } } },
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
          category: { select: { name: true } },
          brand: { select: { name: true } },
        },
      }),

      prisma.category.findMany({
        where: {
          name: { contains: q, mode: "insensitive" },
        },
        take: 3,
        select: {
          id: true,
          name: true,
        },
      }),
    ]);

    return NextResponse.json({
      products: matchingProducts,
      categories: matchingCategories,
      trendingSearches,
    });
  } catch (error) {
    console.error("Live Search API Error:", error);
    return NextResponse.json({ error: "Arama sırasında hata oluştu." }, { status: 500 });
  }
}
