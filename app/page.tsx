import { prisma } from "@/lib/prisma";
import ProductCard from "@/components/ProductCard";
import Link from "next/link"; 

export const dynamic = "force-dynamic";

export default async function Home() {
  // 1. KATEGORİLERİ ÇEK (Sadece ilk 4 ana kategoriyi vitrinde göstermek için)
  const categories = await prisma.category.findMany({
    take: 4,
  });

  // 2. YENİ GELENLER (En son eklenen 4 aktif ürün)
  const newProducts = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
    take: 4,
    include: { 
      images: true,
      category: true,
      reviews: { select: { rating: true } } // Dinamik yıldızlar için eklendi
    }
  });

  // 3. EN ÇOK SATANLAR (Şemandaki salesCount alanını kullanarak ilk 4 ürün)
  const popularProducts = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { salesCount: 'desc' },
    take: 4,
    include: { 
      images: true,
      category: true,
      reviews: { select: { rating: true } }
    }
  });

  // Veritabanı verisini ProductCard'ın istediği formata çeviren yardımcı fonksiyon
  const formatProductForCard = (product: any) => ({
    id: product.id,
    name: product.name,
    price: product.price,
    imageUrl: product.images?.[0]?.imageUrl || "", // İlk resmi al
    stock: product.stock,
    category: product.category,
    reviews: product.reviews
  });

  return (
    <main className="min-h-screen bg-white">
      
      {/* --- 1. BÖLÜM: HERO BANNER --- */}
      <section className="relative bg-gray-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-40 bg-[url('https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/80 to-transparent"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 flex flex-col items-start">
          <span className="inline-block py-1 px-3 rounded-full bg-blue-600 text-xs font-bold tracking-wider mb-4 border border-blue-400">
            YENİ SEZON İNDİRİMİ
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4 max-w-2xl leading-tight">
            Teknolojinin En Yeni Hali Şimdi Vitrin'de.
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-xl">
            Seçili Apple ve premium teknoloji ürünlerinde %20'ye varan indirimleri kaçırmayın. Üstelik tüm siparişlerde ücretsiz kargo.
          </p>
          <Link href="/products" className="bg-white text-gray-900 font-bold px-8 py-4 rounded-lg hover:bg-gray-100 hover:scale-105 transition-all shadow-lg">
            Hemen İncele
          </Link>
        </div>
      </section>

      {/* --- 2. BÖLÜM: AVANTAJLAR (NEDEN BİZ?) --- */}
      <section className="border-b border-gray-100 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="flex flex-col items-center gap-2 p-4">
              <div className="bg-blue-100 text-blue-600 p-3 rounded-full">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
              </div>
              <span className="font-bold text-gray-900 text-sm">Ücretsiz Kargo</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4">
              <div className="bg-green-100 text-green-600 p-3 rounded-full">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </div>
              <span className="font-bold text-gray-900 text-sm">Güvenli Ödeme</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4">
              <div className="bg-purple-100 text-purple-600 p-3 rounded-full">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <span className="font-bold text-gray-900 text-sm">Aynı Gün Teslimat</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4">
              <div className="bg-orange-100 text-orange-600 p-3 rounded-full">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              </div>
              <span className="font-bold text-gray-900 text-sm">Kolay İade</span>
            </div>
          </div>
        </div>
      </section>

      {/* --- 3. BÖLÜM: EN ÇOK SATANLAR --- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900">En Çok Satanlar 🔥</h2>
            <p className="text-gray-500 mt-2">Müşterilerimizin favori ürünlerini keşfedin.</p>
          </div>
          <Link href="/products?sort=popular" className="hidden sm:block text-blue-600 font-bold hover:underline">
            Tümünü Gör &rarr;
          </Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {popularProducts.map((product) => (
            <ProductCard key={product.id} product={formatProductForCard(product)} />
          ))}
        </div>
      </section>

      {/* --- 4. BÖLÜM: KATEGORİLER --- */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-8 text-center">Kategorilere Göz At</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((category) => (
              <Link key={category.id} href={`/products?category=${category.id}`}>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center hover:shadow-md hover:border-blue-200 hover:-translate-y-1 transition-all group">
                  <h3 className="font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                    {category.name}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* --- 5. BÖLÜM: YENİ GELENLER --- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900">Yeni Gelenler ✨</h2>
            <p className="text-gray-500 mt-2">Kataloğumuza eklenen en son teknoloji ürünleri.</p>
          </div>
          <Link href="/products?sort=newest" className="hidden sm:block text-blue-600 font-bold hover:underline">
            Tümünü Gör &rarr;
          </Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {newProducts.map((product) => (
            <ProductCard key={product.id} product={formatProductForCard(product)} />
          ))}
        </div>
      </section>

    </main>
  );
}