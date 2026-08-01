import { prisma } from "@/lib/prisma";
import ProductCard, { ProductCardProps } from "@/components/ProductCard";
import Link from "next/link"; 
import CategorySlider from "@/components/storefront/CategorySlider";
import BrandSlider from "@/components/storefront/BrandSlider";
import FlashSaleSection from "@/components/storefront/FlashSaleSection";
import TrustAndNewsletter from "@/components/storefront/TrustAndNewsletter";
import PersonalizedSection from "@/components/storefront/PersonalizedSection";
import { getPersonalizedRecommendations } from "@/lib/recommendation-engine";
import { currentUser } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

export default async function Home() {
  const clerkUser = await currentUser();
  let dbUserId: string | undefined = undefined;

  if (clerkUser?.emailAddresses?.[0]?.emailAddress) {
    const dbUser = await prisma.user.findUnique({
      where: { email: clerkUser.emailAddresses[0].emailAddress },
      select: { id: true },
    });
    if (dbUser) dbUserId = dbUser.id;
  }

  // 1. PARALEL SUNUCU SORGULARI (Promise.all ile Maximum Performans)
  const [categories, brands, newProductsRaw, popularProductsRaw, flashSaleProductsRaw, personalizedProducts] =
    await Promise.all([
      prisma.category.findMany({
        include: {
          _count: {
            select: { products: { where: { isActive: true } } },
          },
        },
        orderBy: { name: "asc" },
      }),
      prisma.brand.findMany({
        orderBy: { name: "asc" },
      }),
      prisma.product.findMany({
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
        take: 4,
        include: { 
          category: { select: { name: true } },
          reviews: { select: { rating: true } },
        },
      }),
      prisma.product.findMany({
        where: { isActive: true },
        orderBy: { salesCount: "desc" },
        take: 4,
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
      getPersonalizedRecommendations(dbUserId, 8),
    ]);

  const formatProductForCard = (p: any): ProductCardProps => ({
    id: p.id,
    name: p.name,
    price: p.price,
    comparePrice: p.comparePrice,
    imageUrl: p.imageUrl || "",
    stock: p.stock,
    category: p.category ?? undefined,
    reviews: p.reviews,
  });

  const newProducts = newProductsRaw.map(formatProductForCard);
  const popularProducts = popularProductsRaw.map(formatProductForCard);
  const flashSaleProducts = flashSaleProductsRaw.map(formatProductForCard);

  return (
    <main className="min-h-screen bg-white w-full overflow-x-clip">
      
      {/* HERO SECTION */}
      <section className="relative bg-gray-900 text-white overflow-hidden w-full">
        <div className="absolute inset-0 opacity-40 bg-[url('https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-950/85 to-gray-900/60 z-10" />
        
        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-36 flex flex-col items-start">
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/10 border border-white/15 backdrop-blur-md text-xs font-bold text-white shadow-xl mb-4">
            <span className="text-amber-400 flex items-center gap-1">⚡ YENİ SEZON FESTİVALİ</span>
            <span className="text-white/30">|</span>
            <span className="text-rose-400 font-extrabold">%40'a Varan İndirim</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight mb-4 max-w-3xl leading-tight">
            Geleceğin Teknolojisi Şimdi Vitrin'de.
          </h1>
          <p className="text-sm sm:text-lg md:text-xl text-gray-300 mb-8 max-w-xl leading-relaxed font-medium">
            Seçili Apple, Samsung ve premium teknoloji ürünlerinde sepette ek %15 indirim fırsatını kaçırmayın.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/products"
              className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-7 py-3.5 rounded-2xl transition-all shadow-lg shadow-blue-600/30 hover:scale-[1.02] flex items-center justify-center gap-2 min-h-[48px]"
            >
              <span>Hemen Keşfet</span>
              <span>&rarr;</span>
            </Link>

            <Link
              href="/products?sort=popular"
              className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-extrabold px-6 py-4 rounded-2xl transition backdrop-blur-xs text-sm sm:text-base min-h-[48px] flex items-center justify-center gap-2"
            >
              🔥 Çok Satanlar
            </Link>
          </div>
        </div>
      </section>

      {/* FEATURE BAR */}
      <section className="border-b border-gray-100 bg-gray-50/70 py-6 sm:py-8 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4 text-center">
            <div className="flex items-center gap-3 p-3.5 bg-white rounded-2xl border border-gray-100/80 shadow-2xs">
              <div className="bg-blue-100 text-blue-600 p-2.5 rounded-xl text-xl flex-shrink-0">🚚</div>
              <div className="text-left">
                <span className="font-extrabold text-gray-900 text-xs sm:text-sm block">Ücretsiz Kargo</span>
                <span className="text-[10px] text-gray-400 font-bold block">5.000 ₺ Üzerine</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5 bg-white rounded-2xl border border-gray-100/80 shadow-2xs">
              <div className="bg-green-100 text-green-600 p-2.5 rounded-xl text-xl flex-shrink-0">🔒</div>
              <div className="text-left">
                <span className="font-extrabold text-gray-900 text-xs sm:text-sm block">Güvenli Ödeme</span>
                <span className="text-[10px] text-gray-400 font-bold block">256-Bit SSL Koruma</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5 bg-white rounded-2xl border border-gray-100/80 shadow-2xs">
              <div className="bg-purple-100 text-purple-600 p-2.5 rounded-xl text-xl flex-shrink-0">⚡</div>
              <div className="text-left">
                <span className="font-extrabold text-gray-900 text-xs sm:text-sm block">Hızlı Teslimat</span>
                <span className="text-[10px] text-gray-400 font-bold block">24 Saatte Kargoda</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5 bg-white rounded-2xl border border-gray-100/80 shadow-2xs">
              <div className="bg-orange-100 text-orange-600 p-2.5 rounded-xl text-xl flex-shrink-0">↩️</div>
              <div className="text-left">
                <span className="font-extrabold text-gray-900 text-xs sm:text-sm block">14 Gün İade</span>
                <span className="text-[10px] text-gray-400 font-bold block">Kolay ve Ücretsiz</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5 bg-white rounded-2xl border border-gray-100/80 shadow-2xs col-span-2 md:col-span-1">
              <div className="bg-amber-100 text-amber-600 p-2.5 rounded-xl text-xl flex-shrink-0">⭐</div>
              <div className="text-left">
                <span className="font-extrabold text-gray-900 text-xs sm:text-sm block">Orijinal Ürün</span>
                <span className="text-[10px] text-gray-400 font-bold block">%100 Resmi Garanti</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🚀 AI KİŞİSELLEŞTİRİLMİŞ ÖNERİLER BÖLÜMÜ */}
      <PersonalizedSection products={personalizedProducts} />

      {/* KATEGORİ KAYDIRICI */}
      <section className="bg-white py-10 sm:py-16 overflow-hidden w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-6 sm:mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Kategorilere Göz At 📦</h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1 font-medium">Aradığınız teknoloji ürününü kategorilere göre keşfedin.</p>
            </div>
          </div>
          
          <CategorySlider categories={categories} />
        </div>
      </section>

      {/* FLASH SALE BÖLÜMÜ */}
      <FlashSaleSection products={flashSaleProducts} />

      {/* EN ÇOK SATANLAR */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 bg-gray-50/80 rounded-3xl mb-10 sm:mb-16 border border-gray-200/80">
        <div className="flex justify-between items-end mb-6 sm:mb-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-amber-100 text-amber-800 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                🔥 POPÜLER ÜRÜNLER
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mt-1">En Çok Satanlar</h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 font-medium">Müşterilerimizin en çok tercih ettiği ürünler.</p>
          </div>
          <Link href="/products?sort=popular" className="hidden sm:inline-flex items-center gap-1 text-blue-600 font-extrabold hover:underline text-sm">
            Tümünü Gör &rarr;
          </Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {popularProducts.map((product) => (
            <ProductCard key={product.id} product={{ ...product, badgeText: "🔥 Çok Satan" }} />
          ))}
        </div>
      </section>

      {/* YENİ GELENLER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 bg-white rounded-3xl mb-10 sm:mb-16">
        <div className="flex justify-between items-end mb-6 sm:mb-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-blue-100 text-blue-800 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                ✨ YENİ EKLEMENENLER
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mt-1">Yeni Gelenler</h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 font-medium">Kataloğumuza en son eklenen yeni ürünler.</p>
          </div>
          <Link href="/products?sort=newest" className="hidden sm:inline-flex items-center gap-1 text-blue-600 font-extrabold hover:underline text-sm">
            Tümünü Gör &rarr;
          </Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {newProducts.map((product) => (
            <ProductCard key={product.id} product={{ ...product, badgeText: "✨ Yeni" }} />
          ))}
        </div>
      </section>

      {/* MARKA DENEYİMİ */}
      <section className="py-10 sm:py-16 overflow-hidden bg-gray-50/50 border-y border-gray-100 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-10">
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Öne Çıkan Markalar 🌟</h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 font-medium">Dünyanın en iyi teknoloji markaları Vitrin güvencesiyle.</p>
          </div>
          
          <BrandSlider brands={brands} />
        </div>
      </section>

      {/* TRUST VE NEWSLETTER */}
      <TrustAndNewsletter />

    </main>
  );
}