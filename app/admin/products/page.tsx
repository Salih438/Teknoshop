import { checkIsAdmin } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import AdminProductsClient, { ProductDTO } from "@/components/admin/products/AdminProductsClient";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    category?: string;
    brand?: string;
    status?: string;
    stockStatus?: string;
  }>;
}) {
  // 1. SUNUCU RBAC GÜVENLİK KONTROLÜ
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) {
    redirect("/");
  }

  const resolvedParams = await searchParams;
  const searchQuery = resolvedParams?.q?.trim() || "";
  const categoryId = resolvedParams?.category || "";
  const brandId = resolvedParams?.brand || "";
  const statusFilter = resolvedParams?.status || "";
  const stockStatusFilter = resolvedParams?.stockStatus || "";

  // 2. PARALEL SUNUCU METRİK SORGULARI (Promise.all ile Maximum Performans)
  const [
    totalProducts,
    activeCount,
    passiveCount,
    criticalStockCount,
    totalBrands,
    totalCategories,
    categories,
    brands,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { isActive: true } }),
    prisma.product.count({ where: { isActive: false } }),
    prisma.product.count({ where: { stock: { lte: 5 }, isActive: true } }),
    prisma.brand.count(),
    prisma.category.count(),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.brand.findMany({ orderBy: { name: "asc" } }),
  ]);

  // 3. DİNAMİK VERİTABANI WHERECONDITION KUTUSU
  const whereCondition: Prisma.ProductWhereInput = {};

  if (categoryId) {
    whereCondition.categoryId = categoryId;
  }

  if (brandId) {
    whereCondition.brandId = brandId;
  }

  if (statusFilter === "active") {
    whereCondition.isActive = true;
  } else if (statusFilter === "passive") {
    whereCondition.isActive = false;
  }

  if (stockStatusFilter === "in_stock") {
    whereCondition.stock = { gt: 5 };
  } else if (stockStatusFilter === "critical") {
    whereCondition.stock = { gte: 1, lte: 5 };
  } else if (stockStatusFilter === "out_of_stock") {
    whereCondition.stock = 0;
  }

  if (searchQuery) {
    whereCondition.OR = [
      { name: { contains: searchQuery, mode: "insensitive" } },
      { sku: { contains: searchQuery, mode: "insensitive" } },
      { slug: { contains: searchQuery, mode: "insensitive" } },
      { category: { name: { contains: searchQuery, mode: "insensitive" } } },
      { brand: { name: { contains: searchQuery, mode: "insensitive" } } },
    ];
  }

  // 4. ÜRÜN LİSTESİ SORGUSU (N+1 ENGELİ İÇİN SELECT & INCLUDES)
  const dbProducts = await prisma.product.findMany({
    where: whereCondition,
    include: {
      category: { select: { id: true, name: true } },
      brand: { select: { id: true, name: true } },
      variants: { select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 300, // Performans Sınırı
  });

  // DTO Dönüşümü
  const products: ProductDTO[] = dbProducts.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    price: p.price,
    comparePrice: p.comparePrice,
    stock: p.stock,
    isActive: p.isActive,
    imageUrl: p.imageUrl,
    category: p.category,
    brand: p.brand,
    createdAt: p.createdAt.toISOString(),
    variantsCount: p.variants.length,
  }));

  return (
    <div className="w-full">
      <AdminProductsClient
        products={products}
        categories={categories}
        brands={brands}
        totalProducts={totalProducts}
        activeCount={activeCount}
        passiveCount={passiveCount}
        criticalStockCount={criticalStockCount}
        totalBrands={totalBrands}
        totalCategories={totalCategories}
      />
    </div>
  );
}