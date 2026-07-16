import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import ProfileStats from "@/components/profile/ProfileStats";
import OrderProgressBar from "@/components/profile/OrderProgressBar";
import AddressManager from "@/components/profile/AddressManager";
import EditProfileModal from "@/components/profile/EditProfileModal";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect("/");

  const email = clerkUser.emailAddresses[0].emailAddress;

  const dbUser = await prisma.user.findUnique({
    where: { email },
  });

  if (!dbUser) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Profilinize Hoş Geldiniz</h1>
        <p className="text-gray-600 mb-8">Henüz sistemimizde kayıtlı bir işlem geçmişiniz bulunmuyor.</p>
        <Link href="/products" className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition">
          Hemen Alışverişe Başla
        </Link>
      </div>
    );
  }

  // 1. SİPARİŞ SORGUSU
  const userOrders = await prisma.order.findMany({
    where: { userId: dbUser.id },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: { product: { select: { name: true } } }
      }
    }
  });

  // 2. ADRES SORGUSU
  const userAddresses = await prisma.address.findMany({
    where: { userId: dbUser.id },
    orderBy: { createdAt: "desc" }
  });

  // İSTATİSTİKLERİ HESAPLAMA
  const totalOrders = userOrders.length;
  const totalSpent = userOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
  const deliveredOrders = userOrders.filter(order => order.status === "DELIVERED").length;
  const favoritesCount = 8; // Gelecekte Favorite tablosundan çekeceğiz (Mock veri)

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8 bg-gray-50/50 min-h-screen">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Hesabım</h1>
          <p className="text-gray-500 mt-1">Kişisel bilgilerinizi, adreslerinizi ve sipariş geçmişinizi buradan takip edebilirsiniz.</p>
        </div>
        <EditProfileModal 
          initialName={dbUser.name} 
          initialPhone={dbUser.phone} 
          email={dbUser.email} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* SOL KOLON: KULLANICI BİLGİLERİ */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-24">
            
            {/* ✨ DİNAMİK PROFİL FOTOĞRAFI ALANI ✨ */}
            <div className="w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center overflow-hidden border-2 border-blue-100 shadow-sm relative group bg-blue-50">
              {dbUser.avatarUrl ? (
                <img 
                  src={dbUser.avatarUrl} 
                  alt={dbUser.name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-blue-600 text-3xl font-bold">
                  {dbUser.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">{dbUser.name}</h2>
              <p className="text-gray-500 text-sm">{dbUser.email}</p>
            </div>
            
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 font-medium">Telefon</span>
                <span className="font-bold text-gray-900">{dbUser.phone || "Belirtilmemiş"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 font-medium">Kayıt Tarihi</span>
                <span className="font-bold text-gray-900">{new Date(dbUser.createdAt).toLocaleDateString("tr-TR")}</span>
              </div>
            </div>
          </div>
        </div>

        {/* SAĞ KOLON: İSTATİSTİKLER, SİPARİŞLER VE ADRESLER */}
        <div className="lg:col-span-2">
          
          <ProfileStats 
            totalOrders={totalOrders} 
            totalSpent={totalSpent} 
            deliveredOrders={deliveredOrders} 
            favoritesCount={favoritesCount} 
          />

          {/* SİPARİŞ GEÇMİŞİ */}
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            📦 Sipariş Geçmişim
          </h3>

          {userOrders.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-gray-100 shadow-sm text-center">
              <span className="text-6xl mb-4 block">🛍️</span>
              <p className="text-gray-500 mb-4 text-lg">Henüz hiç sipariş vermemişsiniz.</p>
              <Link href="/products" className="text-blue-600 font-bold hover:underline">Alışverişe Başla &rarr;</Link>
            </div>
          ) : (
            <div className="space-y-6">
              {userOrders.map((order) => (
                <div key={order.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 border-b pb-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Sipariş No</p>
                      <p className="font-mono font-bold text-gray-900 text-lg">#{order.id.slice(-8).toUpperCase()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Tarih</p>
                      <p className="font-medium text-gray-900">{new Date(order.createdAt).toLocaleDateString("tr-TR")}</p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Tutar</p>
                      <p className="font-extrabold text-blue-600 text-lg">{order.totalPrice.toLocaleString("tr-TR")} ₺</p>
                    </div>
                    <div>
                      <Link href={`/profile/orders/${order.id}`} className="inline-block bg-blue-50 text-blue-700 font-bold px-4 py-2 rounded-lg text-sm hover:bg-blue-100 transition">
                        🔍 Detayları Gör
                      </Link>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm font-bold text-gray-700 mb-2">İçerisindeki Ürünler:</p>
                    <div className="flex flex-wrap gap-2">
                      {order.items.map(item => (
                        <span key={item.id} className="bg-gray-50 border border-gray-200 px-3 py-1 rounded-lg text-sm text-gray-700 font-medium">
                          {item.product?.name || "Silinmiş Ürün"} <span className="text-gray-400 ml-1">x{item.quantity}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <OrderProgressBar status={order.status} />
                  
                </div>
              ))}
            </div>
          )}

          {/* ADRES YÖNETİMİ MODÜLÜ */}
          <AddressManager initialAddresses={userAddresses} />

        </div>
      </div>
    </div>
  );
}