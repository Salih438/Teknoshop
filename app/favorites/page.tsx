import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import AddToCartButton from "@/components/AddToCartButton";
import FavoriteButton from "@/components/FavoriteButton";

export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  const clerkUser = await currentUser();

  // Oturum açılmamışsa giriş sayfasına yönlendir
  if (!clerkUser) {
    redirect("/sign-in");
  }

  const email = clerkUser.emailAddresses[0]?.emailAddress || "";

  // DB'deki kullanıcıyı e-posta ile bulma mantığın
  const dbUser = await prisma.user.findUnique({
    where: { email: email }
  });

  const activeUserId = dbUser?.id || clerkUser.id;

  // Kullanıcının favorilediği ürünleri ilişkileriyle beraber çek
  const favoriteItems = await prisma.favorite.findMany({
    where: {
      userId: activeUserId,
    },
    include: {
      product: {
        include: {
          images: true,
          category: true,
        }
      }
    },
    orderBy: {
      id: "desc"
    }
  });

  return (
    <main className="min-h-screen bg-gray-50/30">
      <div className="max-w-7xl mx-auto p-4 md:p-8 mt-4 animate-in fade-in duration-500">
        
        {/* Üst Başlık Alanı */}
        <div className="mb-10 border-b border-gray-100 pb-6">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
            Favorilerim
            <span className="bg-red-50 text-red-500 text-sm px-3 py-1 rounded-full font-bold">
              {favoriteItems.length} Ürün
            </span>
          </h1>
          <p className="text-gray-500 mt-2 font-medium">
            Beğendiğiniz ve takip ettiğiniz ürünler burada listelenir.
          </p>
        </div>

        {favoriteItems.length === 0 ? (
          /* BOŞ DURUM (EMPTY STATE) EKRANI */
          <div className="bg-white p-16 rounded-3xl border border-gray-100 text-center shadow-sm flex flex-col items-center justify-center animate-in zoom-in-95 duration-300">
            <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Favorileriniz Boş</h2>
            <p className="text-gray-500 text-lg font-medium mb-8 max-w-md">
              Şu an için favorilerinize eklediğiniz bir ürün bulunmuyor. Binlerce ürünü keşfetmek için vitrine göz atın.
            </p>
            <Link 
              href="/products" 
              className="bg-gray-900 text-white font-bold py-4 px-8 rounded-xl inline-flex items-center gap-2 hover:bg-black transition-all hover:-translate-y-0.5 shadow-md"
            >
              Ürünleri Keşfet
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </Link>
          </div>
        ) : (
          /* ÜRÜN KARTLARI LİSTESİ (Senin Orijinal Mimarine Sadık Kalındı) */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {favoriteItems.map(({ product }) => {
              const displayImage = product.images?.[0]?.imageUrl || product.imageUrl;
              const isOutOfStock = product.stock <= 0;

              return (
                <div key={product.id} className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 flex flex-col relative group">
                  
                  {/* Favori Butonu Senin Yazdığın Şekilde Korundu */}
                  <div className="absolute top-4 right-4 z-10">
                    <FavoriteButton productId={product.id} initialIsFavorite={true} />
                  </div>

                  <Link href={`/products/${product.id}`} className="relative h-56 bg-white flex items-center justify-center p-6 overflow-hidden border-b border-gray-50">
                    {displayImage ? (
                      <img 
                        src={displayImage} 
                        alt={product.name}
                        className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-500"
                      />
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
                      
                      {/* AddToCartButon Senin Yazdığın Props Mimarisiyle Korundu */}
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
    </main>
  );
}