import { prisma } from "@/lib/prisma";
import Link from "next/link";
import AddToCartButton from "@/components/AddToCartButton";

export default async function AllProductsPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ sort?: string, min?: string, max?: string, category?: string }> 
}) {
  const { sort, min, max, category } = await searchParams;

  // 1. Prisma Filtreleme Mantığı (Fiyat Aralığı ve AKTİF ÜRÜNLER)
  let whereClause: any = {
    isActive: true, // EN KRİTİK GÜNCELLEME: Sadece aktif ürünleri getir!
  };
  
  if (min || max) {
    whereClause.price = {};
    if (min) whereClause.price.gte = parseInt(min);
    if (max) whereClause.price.lte = parseInt(max);
  }

  // 2. Prisma Sıralama Mantığı
  let orderByClause: any = { createdAt: "desc" };
  if (sort === "price_asc") orderByClause = { price: "asc" };
  if (sort === "price_desc") orderByClause = { price: "desc" };

  // 3. Veritabanı Sorgusu
  const products = await prisma.product.findMany({
    where: whereClause,
    orderBy: orderByClause,
    include: {
      images: true, 
    }
  });

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 mt-4">
      
      {/* ÜST BİLGİ VE SIRALAMA ÇUBUĞU */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 border-b border-gray-200 pb-4 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tüm Ürünler</h1>
          <p className="text-gray-500 mt-2">
            Kataloğumuzdaki <span className="font-bold text-blue-600">{products.length}</span> ürünü inceliyorsunuz.
          </p>
        </div>
        
        {/* Sıralama Butonları */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold text-gray-700 hidden sm:block">Sırala:</label>
          <div className="flex flex-wrap gap-2">
            <Link href="/products" className={`text-sm px-3 py-1.5 rounded-lg border font-medium transition ${!sort ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
              En Yeniler
            </Link>
            <Link href="/products?sort=price_asc" className={`text-sm px-3 py-1.5 rounded-lg border font-medium transition ${sort === 'price_asc' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
              En Düşük Fiyat
            </Link>
            <Link href="/products?sort=price_desc" className={`text-sm px-3 py-1.5 rounded-lg border font-medium transition ${sort === 'price_desc' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
              En Yüksek Fiyat
            </Link>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* SOL TARAF: FİLTRELEME MENÜSÜ (SIDEBAR) */}
        <div className="w-full lg:w-64 flex-shrink-0 space-y-6">
          
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">Kategoriler</h3>
            <ul className="space-y-3 text-sm text-gray-600 font-medium">
              <li className="cursor-pointer hover:text-blue-600 flex justify-between items-center group">
                <span>Bilgisayar</span> <span className="bg-gray-100 text-gray-500 group-hover:bg-blue-100 group-hover:text-blue-700 px-2 py-0.5 rounded-full text-xs transition">12</span>
              </li>
              <li className="cursor-pointer hover:text-blue-600 flex justify-between items-center group">
                <span>Akıllı Telefon</span> <span className="bg-gray-100 text-gray-500 group-hover:bg-blue-100 group-hover:text-blue-700 px-2 py-0.5 rounded-full text-xs transition">8</span>
              </li>
              <li className="cursor-pointer hover:text-blue-600 flex justify-between items-center group">
                <span>Ses & Müzik</span> <span className="bg-gray-100 text-gray-500 group-hover:bg-blue-100 group-hover:text-blue-700 px-2 py-0.5 rounded-full text-xs transition">5</span>
              </li>
            </ul>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">Fiyat Aralığı</h3>
            <ul className="space-y-3 text-sm font-medium">
              <li>
                <Link href="/products" className={`block hover:text-blue-600 transition ${!min && !max ? 'text-blue-600 font-bold' : 'text-gray-600'}`}>Tüm Fiyatlar</Link>
              </li>
              <li>
                <Link href="/products?max=10000" className={`block hover:text-blue-600 transition ${max === '10000' ? 'text-blue-600 font-bold' : 'text-gray-600'}`}>10.000 TL Altı</Link>
              </li>
              <li>
                <Link href="/products?min=10000&max=30000" className={`block hover:text-blue-600 transition ${min === '10000' && max === '30000' ? 'text-blue-600 font-bold' : 'text-gray-600'}`}>10.000 TL - 30.000 TL</Link>
              </li>
              <li>
                <Link href="/products?min=30000" className={`block hover:text-blue-600 transition ${min === '30000' && !max ? 'text-blue-600 font-bold' : 'text-gray-600'}`}>30.000 TL Üzeri</Link>
              </li>
            </ul>
          </div>
        </div>

        {/* SAĞ TARAF: ÜRÜN LİSTESİ (GRID) */}
        <div className="flex-1">
          {products.length === 0 ? (
            <div className="bg-white p-12 rounded-xl border border-gray-100 text-center shadow-sm">
              <div className="text-4xl mb-4">🔍</div>
              <p className="text-gray-500 text-lg font-medium">Seçtiğiniz filtrelere uygun ürün bulamadık.</p>
              <Link href="/products" className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg mt-6 inline-block hover:bg-blue-700 transition">
                Filtreleri Temizle
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {products.map((product) => {
                
                const extractedImageUrls = product.images.map((img) => img.imageUrl);
                const displayImage = extractedImageUrls.length > 0 ? extractedImageUrls[0] : null;

                const mockRating = (Math.random() * (5 - 4) + 4).toFixed(1); 
                const mockReviewCount = Math.floor(Math.random() * 200) + 15; 
                const isOutOfStock = product.stock <= 0; 

                return (
                  <div key={product.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col relative group">
                    
                    {/* Stok Rozeti */}
                    {isOutOfStock ? (
                      <span className="absolute top-3 left-3 z-10 bg-red-500 text-white text-xs font-extrabold px-3 py-1 rounded-md shadow-sm">
                        TÜKENDİ
                      </span>
                    ) : (
                      <span className="absolute top-3 left-3 z-10 bg-green-500 text-white text-xs font-extrabold px-3 py-1 rounded-md shadow-sm">
                        STOKTA
                      </span>
                    )}

                    {/* Görsel */}
                    <Link href={`/products/${product.id}`} className="block relative h-60 bg-gray-50 flex items-center justify-center p-6 overflow-hidden">
                      {displayImage ? (
                        <img 
                          src={displayImage} 
                          alt={product.name}
                          className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <span className="text-gray-400 font-medium">Görsel Yok</span>
                      )}
                    </Link>

                    {/* Detaylar */}
                    <div className="p-5 flex flex-col flex-1 border-t border-gray-100">
                      
                      {/* Yıldızlar */}
                      <div className="flex items-center gap-1 mb-3">
                        <div className="flex text-yellow-400 text-sm">
                          {'★'.repeat(Math.floor(Number(mockRating)))}
                        </div>
                        <span className="text-xs font-bold text-gray-700 ml-1">{mockRating}</span>
                        <span className="text-xs text-gray-400 ml-1">({mockReviewCount})</span>
                      </div>

                      {/* Başlık */}
                      <Link href={`/products/${product.id}`}>
                        <h2 className="text-lg font-bold text-gray-900 mb-1 line-clamp-2 hover:text-blue-600 transition-colors cursor-pointer">
                          {product.name}
                        </h2>
                      </Link>
                      
                      <div className="flex-1"></div>

                      {/* Fiyat ve Buton */}
                      <div className="flex justify-between items-end mt-4 pt-4 border-t border-gray-50">
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-400 line-through mb-0.5">
                            {(product.price * 1.20).toLocaleString('tr-TR')} ₺
                          </span>
                          <span className="text-xl font-extrabold text-blue-600">
                            {product.price.toLocaleString('tr-TR')} ₺
                          </span>
                        </div>
                        
                        <div className={isOutOfStock ? "opacity-50 pointer-events-none" : ""}>
                          <AddToCartButton 
                            product={{
                              id: product.id,
                              name: product.name,
                              price: product.price,
                              imageUrls: extractedImageUrls, 
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
  );
}