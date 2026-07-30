import Image from "next/image";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import AddToCartButton from "@/components/AddToCartButton";
import { Prisma } from "@prisma/client";
import ProductFilterPanel from "@/components/storefront/ProductFilterPanel";

export default async function AllProductsPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ sort?: string, min?: string, max?: string, category?: string, brand?: string }> 
}) {
  const { sort, min, max, category, brand } = await searchParams;

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
        
        {/* SOL TARAF: FİLTRELEME MENÜSÜ (Masaüstünde Sidebar, Mobilde Drawer) */}
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

        {/* SAĞ TARAF: ÜRÜN LİSTESİ (MOBILE-FIRST 2 KOLON GRID) */}
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
            /* MOBİL: 2 KOLON (320px - 430px) / TABLET: 3 KOLON / MASAÜSTÜ: 4 KOLON */
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
              {products.map((product) => {
                const extractedImageUrls = product.images.map((img) => img.imageUrl);
                const displayImage = extractedImageUrls.length > 0 ? extractedImageUrls[0] : (product.imageUrl ? product.imageUrl : null);

                const totalReviews = product.reviews?.length || 0;
                const mockRating = totalReviews > 0 
                  ? ((product.reviews ?? []).reduce((acc, curr) => acc + curr.rating, 0) / totalReviews).toFixed(1)
                  : "0.0";
                const isOutOfStock = product.stock <= 0; 
                const hasDiscount = Boolean(product.comparePrice && product.comparePrice > product.price);
                const discountPercent = hasDiscount ? Math.round(((product.comparePrice! - product.price) / product.comparePrice!) * 100) : 0;

                return (
                  <div key={product.id} className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col relative group h-full">
                    
                    {/* Görsel Alanı */}
                    <Link href={`/products/${product.id}`} className="relative h-44 sm:h-52 bg-white flex items-center justify-center p-3 overflow-hidden border-b border-gray-50">
                      {displayImage ? (
                        <Image src={displayImage} alt={product.name} className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-500" width={500} height={500} />
                      ) : (
                        <span className="text-gray-300 font-medium text-xs">Görsel Yok</span>
                      )}
                      {hasDiscount && (
                        <div className="absolute top-2 left-2 bg-red-600 text-white font-extrabold text-[9px] sm:text-[10px] px-2 py-0.5 rounded-md shadow-xs z-10">
                          %{discountPercent} İndirim
                        </div>
                      )}
                      {isOutOfStock && (
                        <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center z-10">
                          <span className="bg-red-600 text-white font-extrabold px-3 py-1 rounded-lg text-xs shadow-md">Tükendi</span>
                        </div>
                      )}
                    </Link>

                    {/* Detaylar */}
                    <div className="p-3 sm:p-4 flex flex-col flex-1">
                      
                      {/* Yıldızlar */}
                      <div className="flex items-center gap-1 mb-1.5">
                        <div className="flex text-yellow-400 text-xs">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <span key={s} className={s <= Math.round(Number(mockRating)) ? "text-yellow-400" : "text-gray-200"}>★</span>
                          ))}
                        </div>
                        <span className="text-[10px] font-bold text-gray-700">{mockRating}</span>
                      </div>

                      {/* Başlık */}
                      <Link href={`/products/${product.id}`}>
                        <h2 className="text-xs sm:text-sm font-bold text-gray-900 mb-1 line-clamp-2 h-[2.5rem] sm:h-[2.75rem] flex items-start hover:text-blue-600 transition-colors cursor-pointer leading-snug">
                          {product.name}
                        </h2>
                      </Link>

                      {/* Fiyat ve Buton */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mt-auto pt-3 border-t border-gray-50 gap-2">
                        <div className="flex flex-col justify-end min-h-[2.5rem]">
                          {hasDiscount && (
                            <span className="text-[10px] text-gray-400 line-through font-medium leading-none mb-0.5">
                              {product.comparePrice!.toLocaleString('tr-TR')} ₺
                            </span>
                          )}
                          <span className="text-sm sm:text-base font-extrabold text-blue-600 leading-none">
                            {product.price.toLocaleString('tr-TR')} ₺
                          </span>
                        </div>
                        
                        <div className={`w-full sm:w-auto ${isOutOfStock ? "opacity-50 pointer-events-none" : ""}`}>
                          <AddToCartButton 
                            product={{
                              id: product.id,
                              name: product.name,
                              price: product.price,
                              images: product.images, 
                            }} 
                            className="!w-full sm:!w-auto !px-2.5 !py-2 !text-xs !rounded-xl min-h-[44px] flex items-center justify-center"
                          />
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}