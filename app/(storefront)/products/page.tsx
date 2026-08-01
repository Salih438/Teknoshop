import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Prisma } from "@prisma/client";
import { currentUser } from "@clerk/nextjs/server";
import ProductFilterPanel from "@/components/storefront/ProductFilterPanel";
import ProductCard from "@/components/ProductCard";

export default async function AllProductsPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ sort?: string, min?: string, max?: string, category?: string, brand?: string }> 
}) {
  const { sort, min, max, category, brand } = await searchParams;

  // AKTİF KULLANICI FAVORİLERİNİ ÇEKİYORUZ
  const clerkUser = await currentUser();
  let userFavoriteProductIds = new Set<string>();

  if (clerkUser) {
    const email = clerkUser.emailAddresses[0]?.emailAddress;
    if (email) {
      const dbUser = await prisma.user.findUnique({
        where: { email },
        select: { id: true }
      });
      if (dbUser) {
        const userFavs = await prisma.favorite.findMany({
          where: { userId: dbUser.id },
          select: { productId: true }
        });
        userFavoriteProductIds = new Set(userFavs.map(f => f.productId));
      }
    }
  }

  // 1. KATEGORİLERİ DİNAMİK OLARAK ÇEKİYORUZ
  const dbCategories = await prisma.category.findMany({
    include: {
      _count: {
        select: { products: { where: { isActive: true } } }
      }
    },
    orderBy: {
      name: 'asc'
    }
  });

  // MARKALARI ÇEKİYORUZ
  const dbBrands = await prisma.brand.findMany({
    orderBy: { name: 'asc' }
  });

  // 2. PRISMA FİLTRELEME MANTIĞI (Ürünler İçin)
  const whereClause: Prisma.ProductWhereInput = {
    isActive: true,
  };
  
  if (min || max) {
    whereClause.price = {};
    if (min) whereClause.price.gte = parseInt(min);
    if (max) whereClause.price.lte = parseInt(max);
  }

  if (category) {
    whereClause.categoryId = category;
  }

  if (brand) {
    whereClause.brandId = brand;
  }

  // 3. PRISMA SIRALAMA MANTIĞI
  let orderByClause: { createdAt?: "asc" | "desc"; price?: "asc" | "desc" } = { createdAt: "desc" };
  if (sort === "price_asc") orderByClause = { price: "asc" };
  if (sort === "price_desc") orderByClause = { price: "desc" };

  // 4. ÜRÜNLERİ VERİTABANINDAN ÇEK
  const products = await prisma.product.findMany({
    where: whereClause,
    orderBy: orderByClause,
    include: {
      images: true, 
      category: true,
      reviews: { select: { rating: true } }
    }
  });

  // Kategori adını bul (Başlık için)
  const selectedCategoryName = category 
    ? dbCategories.find(c => c.id === category)?.name
    : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 w-full overflow-x-clip">
      
      {/* ÜST BİLGİ */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 border-b border-gray-200 pb-4 gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            {selectedCategoryName ? `${selectedCategoryName} Ürünleri` : "Tüm Ürünler"}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Kataloğumuzdaki <span className="font-bold text-blue-600">{products.length}</span> ürünü inceliyorsunuz.
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        
        {/* SOL TARAF: FİLTRELEME MENÜSÜ */}
        <div className="w-full lg:w-72 flex-shrink-0">
          <ProductFilterPanel 
            categories={dbCategories.map(c => ({ id: c.id, name: c.name }))}
            brands={dbBrands.map(b => ({ id: b.id, name: b.name }))}
            currentSort={sort}
            currentCategory={category}
            currentBrand={brand}
            currentMin={min}
            currentMax={max}
          />
        </div>

        {/* SAĞ TARAF: ÜRÜN LİSTESİ */}
        <div className="flex-1 min-w-0">
          {products.length === 0 ? (
            /* BOŞ DURUM (EMPTY STATE) EKRANI */
            <div className="bg-white p-8 sm:p-12 rounded-2xl border border-gray-100 text-center shadow-xs">
              <div className="text-4xl mb-3">🔍</div>
              <h3 className="font-extrabold text-gray-900 text-base sm:text-lg mb-1">Ürün Bulunamadı</h3>
              <p className="text-gray-500 text-xs sm:text-sm max-w-sm mx-auto">Seçtiğiniz filtrelere uygun ürün bulunamadı. Lütfen filtrelerinizi temizlemeyi deneyin.</p>
              <Link
                href="/products"
                className="bg-blue-600 text-white font-extrabold py-3 px-6 rounded-xl mt-5 inline-flex items-center justify-center hover:bg-blue-700 transition text-xs sm:text-sm min-h-[44px]"
              >
                Tüm Filtreleri Temizle
              </Link>
            </div>
          ) : (
            /* STANDART 4 KOLON GRID */
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
              {products.map((product) => {
                const extractedImageUrls = product.images.map((img) => img.imageUrl);
                const displayImage = extractedImageUrls.length > 0 ? extractedImageUrls[0] : (product.imageUrl || "");

                return (
                  <ProductCard
                    key={product.id}
                    product={{
                      id: product.id,
                      name: product.name,
                      price: product.price,
                      comparePrice: product.comparePrice,
                      imageUrl: displayImage,
                      stock: product.stock,
                      category: product.category ? { name: product.category.name } : undefined,
                      reviews: product.reviews,
                      isFavorite: userFavoriteProductIds.has(product.id),
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}