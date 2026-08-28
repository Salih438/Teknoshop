import { cache } from "react";
import { prisma } from "@/lib/prisma";

/**
 * React cache() ile sarmalanmış kategori sorgusu.
 * Aynı HTTP render döngüsü içinde (layout.tsx, page.tsx, search vb.)
 * kaç kez çağrılırsa çağrılsın veritabanına YALNIZCA 1 KEZ sorgu atar.
 */
export const getCachedStorefrontCategories = cache(async () => {
  return prisma.category.findMany({
    select: {
      id: true,
      name: true,
      _count: {
        select: { products: { where: { isActive: true } } },
      },
    },
    orderBy: { name: "asc" },
  });
});

export const CategoryService = {
  getStorefrontCategories: getCachedStorefrontCategories,
};
