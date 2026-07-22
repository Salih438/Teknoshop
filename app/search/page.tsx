import Image from "next/image";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import AddToCartButton from "@/components/AddToCartButton";
import FavoriteButton from "@/components/FavoriteButton";
import FilterSidebar from "@/components/search/FilterSidebar";

export const dynamic = "force-dynamic";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  const resolvedParams = await searchParams;
  
  const searchQuery = resolvedParams.q || "";
  const categoryId = resolvedParams.category;
  const brandId = resolvedParams.brand;
  const minPrice = resolvedParams.minPrice;
  const maxPrice = resolvedParams.maxPrice;
  const sort = resolvedParams.sort || "newest";

  // Veritabanı Filtre (Where) Koşulları Oluşturma
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const whereClause: any = {
    isActive: true, // Sadece aktif ürünler
  };

  if (searchQuery) {
    whereClause.name = { contains: searchQuery, mode: "insensitive" };
  }
  
  if (categoryId) {
    whereClause.categoryId = categoryId;
  }

  if (brandId) {
    whereClause.brandId = brandId;
  }

  if (minPrice || maxPrice) {
    whereClause.price = {};
    if (minPrice) whereClause.price.gte = parseFloat(minPrice);
    if (maxPrice) whereClause.price.lte = parseFloat(maxPrice);
  }

  // Sıralama (OrderBy) Koşulları Oluşturma
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let orderByClause: any = { createdAt: "desc" };
  if (sort === "price_asc") orderByClause = { price: "asc" };
  if (sort === "price_desc") orderByClause = { price: "desc" };
  if (sort === "sales") orderByClause = { salesCount: "desc" };

  // 1. Ürünleri Çek
  const products = await prisma.product.findMany({
    where: whereClause,
    include: {
      images: true,
      category: true,
    },
    orderBy: orderByClause,
  });

  // 2. Filtre seçenekleri için Kategori ve Markaları Çek
  const categories = await prisma.category.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" }
  });
  
  const brands = await prisma.brand.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" }
  });

  return (
    <main className="min-h-screen bg-gray-50/30">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-12 animate-in fade-in duration-500">
        
        {/* Üst Başlık Alanı */}
        <div className="mb-8 border-b border-gray-100 pb-6">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">
            Arama Sonuçları
          </h1>
          {searchQuery ? (
            <p className="text-gray-500 text-lg">
              &quot;<span className="font-bold text-blue-600">{searchQuery}</span>&quot; kelimesi için <span className="font-bold text-gray-900">{products.length}</span> ürün listeleniyor.
            </p>
          ) : (
            <p className="text-gray-500 text-lg">Toplam <span className="font-bold text-gray-900">{products.length}</span> ürün listeleniyor.</p>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* SOL: FİLTRE PANELİ */}
          <div className="w-full lg:w-1/4">
            <FilterSidebar categories={categories} brands={brands} />
          </div>

          {/* SAĞ: ÜRÜN LİSTESİ */}
          <div className="w-full lg:w-3/4">
            {products.length === 0 ? (
              /* BOŞ DURUM (EMPTY STATE) EKRANI */
              <div className="bg-white p-12 lg:p-16 rounded-3xl shadow-sm border border-gray-100 text-center flex flex-col items-center justify-center animate-in zoom-in-95 duration-300">
                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Sonuç Bulunamadı</h2>
                <p className="text-gray-500 text-lg mb-8 max-w-md">Seçtiğiniz filtrelere uygun bir ürün şu an stoklarımızda bulunmuyor. Farklı kriterler deneyebilirsiniz.</p>
                <Link 
                  href="/search" 
                  className="bg-gray-900 text-white font-bold px-8 py-4 rounded-xl inline-flex items-center gap-2 hover:bg-black transition-all shadow-md hover:-translate-y-0.5"
                >
                  Filtreleri Temizle
                </Link>
              </div>
            ) : (
              /* ARAMA SONUÇLARI KARTLARI */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => {
                  const extractedImageUrls = product.images.map((img) => img.imageUrl);
                  const displayImage = extractedImageUrls.length > 0 ? extractedImageUrls[0] : null;
                  const isOutOfStock = product.stock <= 0;

                  return (
                    <div key={product.id} className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 flex flex-col relative group">
                      
                      {/* Favori Butonu Eklendi */}
                      <div className="absolute top-4 right-4 z-10">
                        <FavoriteButton productId={product.id} initialIsFavorite={false} />
                      </div>

                      <Link href={`/products/${product.id}`} className="relative h-56 bg-white flex items-center justify-center p-6 overflow-hidden border-b border-gray-50">
                        {displayImage ? (
                          <Image src={displayImage} 
                            alt={product.name}
                            className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-500"
                          width={500} height={500} />
                        ) : (
                          <span className="text-gray-300 font-medium text-sm">Görsel Yok</span>
                        )}
                        {isOutOfStock && (
                          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center z-10">
                            <span className="bg-red-600 text-white font-bold px-4 py-1.5 rounded-lg text-sm shadow-lg">Tükendi</span>
                          </div>
                        )}
                      </Link>

                      <div className="p-5 flex flex-col flex-1">
                        <span className="text-[10px] text-gray-400 mb-1.5 font-extrabold uppercase tracking-widest">{product.category?.name || "Kategori Yok"}</span>
                        <Link href={`/products/${product.id}`}>
                          <h2 className="text-sm font-bold text-gray-900 mb-2 line-clamp-2 hover:text-blue-600 transition-colors cursor-pointer">
                            {product.name}
                          </h2>
                        </Link>

                        <div className="flex-1"></div>

                        <div className="flex justify-between items-end mt-4 pt-4 border-t border-gray-50">
                          <div className="flex flex-col">
                            <span className="text-xl font-black text-blue-600 tracking-tight">
                              {product.price.toLocaleString('tr-TR')} ₺
                            </span>
                          </div>
                          
                          <div className={isOutOfStock ? "opacity-50 pointer-events-none" : "hover:scale-105 transition-transform"}>
                            <AddToCartButton 
                              product={{
                                id: product.id,
                                name: product.name,
                                price: product.price,
                                images: product.images,
                              }} 
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
    </main>
  );
}