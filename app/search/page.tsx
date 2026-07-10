import { prisma } from "@/lib/prisma";
import Link from "next/link";
import AddToCartButton from "@/components/AddToCartButton";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const searchQuery = q || "";

  // 1. DOKUNUŞ: Prisma ile arama yaparken ürünün resimlerini de (images) çekiyoruz
  const products = await prisma.product.findMany({
    where: {
      name: { 
        contains: searchQuery, 
        mode: "insensitive" 
      },
    },
    include: {
      images: true, // Yeni veritabanı mimarisine göre resimleri dahil et
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-12 mt-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        Arama Sonuçları
      </h1>
      <p className="text-gray-600 mb-8">
        "<span className="font-semibold text-blue-600">{searchQuery}</span>" için {products.length} ürün bulundu.
      </p>

      {products.length === 0 ? (
        <div className="text-center bg-white p-10 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-gray-500 text-lg">Aradığınız kritere uygun ürün bulamadık.</p>
          <Link href="/" className="text-blue-600 font-bold hover:underline mt-4 inline-block">
            Vitrine Dön
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {products.map((product) => {
            // 2. DOKUNUŞ: Gelen resimleri süzüp düz bir URL dizisine (array) dönüştürüyoruz
            const extractedImageUrls = product.images.map((img) => img.imageUrl);
            const displayImage = extractedImageUrls.length > 0 ? extractedImageUrls[0] : null;

            return (
              <div key={product.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <Link href={`/products/${product.id}`}>
                  <div className="h-64 overflow-hidden bg-white flex items-center justify-center p-4 cursor-pointer group">
                    {displayImage ? (
                      <img 
                        src={displayImage} 
                        alt={product.name}
                        className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <span className="text-gray-400">Görsel Yok</span>
                    )}
                  </div>
                </Link>

                <div className="p-5 border-t border-gray-100">
                  <Link href={`/products/${product.id}`}>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2 truncate hover:text-blue-600 transition-colors cursor-pointer">
                      {product.name}
                    </h2>
                  </Link>
                  <div className="flex justify-between items-center mt-4">
                    <span className="text-xl font-bold text-blue-600">
                      {product.price.toLocaleString('tr-TR')} ₺
                    </span>
                    
                    {/* 3. DOKUNUŞ: Temizlediğimiz resim dizisini sepete ekle butonuna aktarıyoruz */}
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
            );
          })}
        </div>
      )}
    </div>
  );
}