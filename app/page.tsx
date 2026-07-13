import { prisma } from "@/lib/prisma";
import AddToCartButton from "@/components/AddToCartButton";
import Link from "next/link"; 

export const dynamic = "force-dynamic";

export default async function Home() {
  // 1. DOKUNUŞ: İlişkisel veritabanından SADECE AKTİF ürünleri ve resimlerini çekiyoruz
  const products = await prisma.product.findMany({
    where: {
      isActive: true, // EN KRİTİK GÜNCELLEME: Pasif ürünler ana sayfada çıkmaz!
    },
    orderBy: {
      createdAt: 'desc' 
    },
    include: {
      images: true, // Yeni eklenen ProductImage tablosunu dahil et
    }
  });

  return (
    <main className="min-h-screen p-10 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">
          Vitrin
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => {
            // 2. DOKUNUŞ: Gelen karmaşık resim nesnelerini, sepetin anlayacağı basit bir URL dizisine çeviriyoruz
            const extractedImageUrls = product.images.map((img) => img.imageUrl);
            const displayImage = extractedImageUrls.length > 0 ? extractedImageUrls[0] : null;

            return (
              <div key={product.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                
                {/* Görseli Link ile sarmalayıp tıklanabilir yapıyoruz */}
                <Link href={`/products/${product.id}`}>
                  <div className="h-64 overflow-hidden bg-white flex items-center justify-center p-4 cursor-pointer group">
                    {displayImage ? (
                      <img 
                        src={displayImage} 
                        alt={product.name}
                        className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <span className="text-gray-400 font-medium">Görsel Yok</span>
                    )}
                  </div>
                </Link>

                <div className="p-5 border-t border-gray-100">
                  {/* Ürün ismini Link ile sarmalayıp tıklanabilir yapıyoruz */}
                  <Link href={`/products/${product.id}`}>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2 truncate hover:text-blue-600 transition-colors cursor-pointer">
                      {product.name}
                    </h2>
                  </Link>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {product.description}
                  </p>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-blue-600">
                      {product.price.toLocaleString('tr-TR')} ₺
                    </span>
                    
                    {/* 3. DOKUNUŞ: Sepete ekle butonuna doğru formatlanmış resim dizisini gönderiyoruz */}
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
      </div>
    </main>
  );
}