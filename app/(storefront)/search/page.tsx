import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import FilterSidebar from "@/components/search/FilterSidebar";
import ProductCard from "@/components/ProductCard";
import { Metadata } from "next";
import { getMatchingCategoryIds } from "@/lib/synonyms";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}): Promise<Metadata> {
  const resolvedParams = await searchParams;
  const q = resolvedParams.q || "Tüm Ürünler";
  return {
    title: `${q} - Arama Sonuçları | Vitrin Teknolojik Mağaza`,
    description: `${q} araması için en uygun fiyatlı, orijinal ve garantili teknoloji ürünleri Vitrin'de.`,
    openGraph: {
      title: `${q} - Vitrin Mağaza`,
      description: `${q} arama sonuçlarını hemen keşfedin.`,
    },
  };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const resolvedParams = await searchParams;
  
  const searchQuery = resolvedParams.q || "";
  const categoryId = resolvedParams.category;
  const brandId = resolvedParams.brand;
  const minPrice = resolvedParams.minPrice;
  const maxPrice = resolvedParams.maxPrice;
  const inStockOnly = resolvedParams.inStock === "true";
  const sort = resolvedParams.sort || "newest";

  // AKTİF KULLANICI FAVORİLERİNİ ÇEK
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
        userFavoriteProductIds = new Set(userFavs.map((f) => f.productId));
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const whereClause: any = {
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
    whereClause.price = {};
    if (minPrice) whereClause.price.gte = parseFloat(minPrice);
    if (maxPrice) whereClause.price.lte = parseFloat(maxPrice);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let orderByClause: any = { createdAt: "desc" };
  if (sort === "price_asc") orderByClause = { price: "asc" };
  if (sort === "price_desc") orderByClause = { price: "desc" };
  if (sort === "sales") orderByClause = { salesCount: "desc" };

  // 1. PARALEL SUNUCU SORGULARI
  const [products, categories, brands, popularProducts] = await Promise.all([
    prisma.product.findMany({
      where: whereClause,
      include: {
        category: { select: { name: true } },
        reviews: { select: { rating: true } },
      },
      orderBy: orderByClause,
    }),

    prisma.category.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),

    prisma.brand.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),

    // Sonuç bulunamayınca gösterilecek en çok satan ürünler
    prisma.product.findMany({
      where: { isActive: true },
      take: 4,
      orderBy: { salesCount: "desc" },
      include: {
        category: { select: { name: true } },
        reviews: { select: { rating: true } },
      },
    }),
  ]);

  return (
    <main className="min-h-screen bg-gray-50/30 w-full overflow-x-clip">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 animate-in fade-in duration-300">
        
        {/* ÜST BAŞLIK VE ARAMA BİLGİSİ */}
        <div className="mb-6 border-b border-gray-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              Arama & Keşif Merkezi 🔍
            </h1>
            {searchQuery ? (
              <p className="text-gray-500 text-xs sm:text-sm mt-0.5">
                &quot;<span className="font-bold text-blue-600">{searchQuery}</span>&quot; araması için <span className="font-extrabold text-gray-900">{products.length}</span> adet ürün listeleniyor.
              </p>
            ) : (
              <p className="text-gray-500 text-xs sm:text-sm mt-0.5">
                Toplam <span className="font-extrabold text-gray-900">{products.length}</span> adet teknoloji ürünü listeleniyor.
              </p>
            )}
          </div>
        </div>

        {/* FİLTRE CHİPLERİ BARI */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Link
            href={`/search?q=${encodeURIComponent(searchQuery)}&inStock=true`}
            className={`px-3 py-1.5 rounded-full text-xs font-extrabold transition border ${
              inStockOnly ? "bg-green-600 text-white border-green-600 shadow-xs" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
            }`}
          >
            🟢 Yalnızca Stoktakiler
          </Link>
          <Link
            href={`/search?q=${encodeURIComponent(searchQuery)}&sort=sales`}
            className={`px-3 py-1.5 rounded-full text-xs font-extrabold transition border ${
              sort === "sales" ? "bg-amber-500 text-white border-amber-500 shadow-xs" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
            }`}
          >
            🔥 En Çok Satanlar
          </Link>
          <Link
            href={`/search?q=${encodeURIComponent(searchQuery)}&sort=price_asc`}
            className={`px-3 py-1.5 rounded-full text-xs font-extrabold transition border ${
              sort === "price_asc" ? "bg-blue-600 text-white border-blue-600 shadow-xs" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
            }`}
          >
            📈 Fiyata Göre Artan
          </Link>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          
          {/* SOL: FİLTRE SIDEBAR */}
          <div className="w-full lg:w-72 flex-shrink-0">
            <FilterSidebar categories={categories} brands={brands} />
          </div>

          {/* SAĞ: ARAMA SONUÇLARI VE SMART EMPTY STATE */}
          <div className="flex-1 min-w-0">
            {products.length === 0 ? (
              
              /* SMART EMPTY STATE */
              <div className="space-y-10">
                <div className="bg-white p-8 sm:p-14 rounded-3xl shadow-xs border border-gray-200 text-center flex flex-col items-center justify-center space-y-4">
                  <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center text-4xl shadow-inner">
                    🔍
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-gray-900">Aradığınız Ürün Bulunamadı</h2>
                  
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 max-w-md text-left text-xs space-y-2 text-gray-600 font-medium">
                    <p className="font-bold text-gray-900">💡 İpuçları & Öneriler:</p>
                    <ul className="list-disc pl-4 space-y-1">
                      <li>Arama kelimesinin yazılışını kontrol edin.</li>
                      <li>Daha genel veya alternatif kelimeler kullanın (Örn: "iPhone" yerine "Telefon").</li>
                      <li>Filtrelerinizi sıfırlayarak arama alanını genişletin.</li>
                    </ul>
                  </div>

                  <Link 
                    href="/search" 
                    className="bg-gray-900 hover:bg-gray-800 text-white font-extrabold px-6 py-3 rounded-xl transition shadow-xs text-xs sm:text-sm min-h-[44px] inline-flex items-center justify-center"
                  >
                    Filtreleri Temizle & Tüm Kataloğu Gör ➔
                  </Link>
                </div>

                {/* ÖNERİLEN ÇOK SATAN ÜRÜNLER */}
                <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-6">
                  <h3 className="font-black text-gray-900 text-base flex items-center gap-2">
                    <span>🔥</span> Belki Bunlar İlginizi Çekebilir (En Çok Satanlar)
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {popularProducts.map((prod) => (
                      <ProductCard
                        key={prod.id}
                        product={{
                          id: prod.id,
                          name: prod.name,
                          price: prod.price,
                          comparePrice: prod.comparePrice,
                          imageUrl: prod.imageUrl || "",
                          stock: prod.stock,
                          category: prod.category ?? undefined,
                          reviews: prod.reviews,
                          badgeText: "🔥 Popüler",
                          isFavorite: userFavoriteProductIds.has(prod.id),
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

            ) : (

              /* ARAMA SONUÇLARI GRID */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={{
                      id: product.id,
                      name: product.name,
                      price: product.price,
                      comparePrice: product.comparePrice,
                      imageUrl: product.imageUrl || "",
                      stock: product.stock,
                      category: product.category ?? undefined,
                      reviews: product.reviews,
                      isFavorite: userFavoriteProductIds.has(product.id),
                    }}
                  />
                ))}
              </div>

            )}
          </div>

        </div>
      </div>
    </main>
  );
}