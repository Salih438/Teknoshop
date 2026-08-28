import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getMatchingCategoryIds } from "@/lib/synonyms";

export interface GetProductsParams {
  categoryId?: string;
  brandId?: string;
  searchQuery?: string;
  minPrice?: string;
  maxPrice?: string;
  inStockOnly?: boolean;
  sort?: string;
  page?: number;
  pageSize?: number;
}

export class ProductService {
  /**
   * Tek bir ürünü tüm ilişkileriyle getirir
   */
  static async getProductById(id: string) {
    return prisma.product.findUnique({
      where: { id },
      include: {
        images: true,
        category: true,
        brand: true,
        variants: true,
        reviews: {
          include: {
            user: { select: { name: true, avatarUrl: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });
  }

  /**
   * Vitrin / Katalog / Arama için filtrelenmiş ve sayfalanmış ürün listesi
   */
  static async getStorefrontProducts(params: GetProductsParams) {
    const {
      categoryId,
      brandId,
      searchQuery,
      minPrice,
      maxPrice,
      inStockOnly,
      sort,
      page = 1,
      pageSize = 12,
    } = params;

    const whereClause: Prisma.ProductWhereInput = {
      isActive: true,
    };

    if (searchQuery) {
      const matchedCategories = await getMatchingCategoryIds(searchQuery);
      const matchedCategoryIds = matchedCategories.map((c) => c.id);

      whereClause.OR = [
        { name: { contains: searchQuery, mode: "insensitive" } },
        { description: { contains: searchQuery, mode: "insensitive" } },
        { category: { name: { contains: searchQuery, mode: "insensitive" } } },
        { brand: { name: { contains: searchQuery, mode: "insensitive" } } },
        ...(matchedCategoryIds.length > 0 ? [{ categoryId: { in: matchedCategoryIds } }] : []),
      ];
    }

    if (categoryId) {
      whereClause.categoryId = categoryId;
    }

    if (brandId) {
      whereClause.brandId = brandId;
    }

    if (inStockOnly) {
      whereClause.stock = { gt: 0 };
    }

    if (minPrice || maxPrice) {
      whereClause.price = {
        ...(minPrice ? { gte: parseFloat(minPrice) } : {}),
        ...(maxPrice ? { lte: parseFloat(maxPrice) } : {}),
      };
    }

    let orderByClause: Prisma.ProductOrderByWithRelationInput = { createdAt: "desc" };
    if (sort === "price_asc") orderByClause = { price: "asc" };
    if (sort === "price_desc") orderByClause = { price: "desc" };
    if (sort === "sales") orderByClause = { salesCount: "desc" };

    const skip = Math.max(0, (page - 1) * pageSize);

    const [totalCount, products] = await Promise.all([
      prisma.product.count({ where: whereClause }),
      prisma.product.findMany({
        where: whereClause,
        orderBy: orderByClause,
        skip,
        take: pageSize,
        include: {
          category: { select: { name: true } },
          reviews: { select: { rating: true } },
        },
      }),
    ]);

    return {
      products,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
      currentPage: page,
    };
  }

  /**
   * Ana sayfa için yeni ve flaş ürünleri getirir
   */
  static async getHomepageProducts(limit = 8) {
    const [newProducts, flashSaleProducts] = await Promise.all([
      prisma.product.findMany({
        where: { isActive: true },
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          category: { select: { name: true } },
          reviews: { select: { rating: true } },
        },
      }),
      prisma.product.findMany({
        where: { isActive: true, comparePrice: { gt: 0 } },
        take: 4,
        include: {
          category: { select: { name: true } },
          reviews: { select: { rating: true } },
        },
      }),
    ]);

    return { newProducts, flashSaleProducts };
  }
}
