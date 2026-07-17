import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import AddToCartButton from "@/components/AddToCartButton";
import FavoriteButton from "@/components/FavoriteButton";

export default async function FavoritesPage() {
  const clerkUser = await currentUser();

  // Oturum açılmamışsa giriş sayfasına yönlendir
  if (!clerkUser) {
    redirect("/sign-in");
  }

  const email = clerkUser.emailAddresses[0]?.emailAddress || "";

  // Senin DB'deki kullanıcıyı e-posta ile bulma mantığın
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
    <div className="max-w-7xl mx-auto p-4 md:p-8 mt-4">
      <div className="mb-8 border-b border-gray-200 pb-4">
        <h1 className="text-3xl font-bold text-gray-900">Favorilerim</h1>
        <p className="text-gray-500 mt-2">
          Beğendiğiniz ve takip ettiğiniz <span className="font-bold text-red-500">{favoriteItems.length}</span> adet ürün bulunuyor.
        </p>
      </div>

      {favoriteItems.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border border-gray-100 text-center shadow-sm">
          <div className="text-5xl mb-4">❤️</div>
          <p className="text-gray-500 text-lg font-medium">Henüz favori ürününüz bulunmuyor.</p>
          <Link href="/products" className="bg-blue-600 text-white font-bold py-2.5 px-6 rounded-lg mt-6 inline-block hover:bg-blue-700 transition">
            Ürünleri Keşfet
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {favoriteItems.map(({ product }) => {
            const displayImage = product.images?.[0]?.imageUrl || product.imageUrl;
            const isOutOfStock = product.stock <= 0;

            return (
              <div key={product.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col relative group">
                
                <FavoriteButton productId={product.id} initialIsFavorite={true} />

                <Link href={`/products/${product.id}`} className="block relative h-48 bg-gray-50 flex items-center justify-center p-4 overflow-hidden">
                  {displayImage ? (
                    <img 
                      src={displayImage} 
                      alt={product.name}
                      className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <span className="text-gray-400 font-medium text-sm">Görsel Yok</span>
                  )}
                </Link>

                <div className="p-4 flex flex-col flex-1 border-t border-gray-100">
                  <span className="text-xs text-gray-400 mb-1 font-semibold uppercase">{product.category?.name || "Kategori Yok"}</span>
                  <Link href={`/products/${product.id}`}>
                    <h2 className="text-sm font-bold text-gray-900 mb-2 line-clamp-2 hover:text-blue-600 transition-colors cursor-pointer">
                      {product.name}
                    </h2>
                  </Link>

                  <div className="flex-1"></div>

                  <div className="flex justify-between items-end mt-4 pt-3 border-t border-gray-50">
                    <div className="flex flex-col">
                      <span className="text-lg font-extrabold text-blue-600">
                        {product.price.toLocaleString('tr-TR')} ₺
                      </span>
                    </div>
                    
                    <div className={isOutOfStock ? "opacity-50 pointer-events-none" : ""}>
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
  );
}