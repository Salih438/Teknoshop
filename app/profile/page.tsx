import Image from "next/image";
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

  // 1. KULLANICIYI GETİR
  let dbUser = await prisma.user.findUnique({
    where: { email },
  });

  // 🚀 KISIR DÖNGÜ KIRICI (Yedek Lazy Sync)
  // Eğer layout.tsx'teki kayıt işleminden önce buraya gelindiyse,
  // UI'ı kilitlemek (Hoş Geldin ekranı) yerine anında kaydı oluştur.
  if (!dbUser) {
    dbUser = await prisma.user.create({
      data: {
        email: email,
        name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || "Değerli Müşterimiz",
        avatarUrl: clerkUser.imageUrl || null,
        role: "USER",
      },
    });
  }

  // 2. SİPARİŞ SORGUSU
  const userOrders = await prisma.order.findMany({
    where: { userId: dbUser.id },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: { product: { select: { name: true } } }
      }
    }
  });

  // 3. ADRES SORGUSU
  const userAddresses = await prisma.address.findMany({
    where: { userId: dbUser.id },
    orderBy: { createdAt: "desc" }
  });

  // İSTATİSTİKLERİ HESAPLAMA
  const totalOrders = userOrders.length;
  const totalSpent = userOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
  const deliveredOrders = userOrders.filter(order => order.status === "DELIVERED").length;
  const favoritesCount = 8; // Gelecekte Favorite tablosundan çekeceğiz (Mock veri)

  // GÖRSEL (AVATAR) BELİRLEME
  const profileImage = dbUser.avatarUrl || clerkUser.imageUrl;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 min-h-screen animate-in fade-in duration-500">
      
      {/* BAŞLIK VE PROFİL DÜZENLEME MODALI */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Hesabım</h1>
          <p className="text-gray-500 mt-2 font-medium">Kişisel bilgilerinizi, adreslerinizi ve sipariş geçmişinizi buradan yönetin.</p>
        </div>
        <EditProfileModal 
          initialName={dbUser.name} 
          initialPhone={dbUser.phone} 
          email={dbUser.email} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* SOL KOLON: KULLANICI BİLGİLERİ KARTI */}
        <div className="lg:col-span-4 xl:col-span-3">
          <div className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 sticky top-28">
            
            <div className="w-28 h-28 mx-auto mb-5 rounded-full flex items-center justify-center overflow-hidden border-4 border-white shadow-lg relative bg-gray-50">
              {profileImage ? (
                <Image src={profileImage} 
                  alt={dbUser.name} 
                  className="w-full h-full object-cover"
                width={500} height={500} />
              ) : (
                <span className="text-blue-600 text-4xl font-extrabold">
                  {dbUser.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            <div className="text-center mb-6">
              <h2 className="text-xl font-extrabold text-gray-900">{dbUser.name}</h2>
              <p className="text-gray-500 text-sm font-medium mt-1">{dbUser.email}</p>
            </div>
            
            <div className="space-y-4 pt-5 border-t border-gray-100/80">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2 text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  <span className="text-sm font-bold">Telefon</span>
                </div>
                <span className="font-extrabold text-gray-900 text-sm">{dbUser.phone || "Eklenmemiş"}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2 text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  <span className="text-sm font-bold">Kayıt Tarihi</span>
                </div>
                <span className="font-extrabold text-gray-900 text-sm">{new Date(dbUser.createdAt).toLocaleDateString("tr-TR")}</span>
              </div>
            </div>
          </div>
        </div>

        {/* SAĞ KOLON: İSTATİSTİKLER, SİPARİŞLER VE ADRESLER */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-10">
          
          <ProfileStats 
            totalOrders={totalOrders} 
            totalSpent={totalSpent} 
            deliveredOrders={deliveredOrders} 
            favoritesCount={favoritesCount} 
          />

          <div className="space-y-6">
            <h3 className="text-2xl font-extrabold text-gray-900 flex items-center gap-3 border-b border-gray-100 pb-4">
              <span className="bg-blue-50 text-blue-600 p-2 rounded-xl">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
              </span>
              Sipariş Geçmişim
            </h3>

            {userOrders.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl border border-gray-100 shadow-sm text-center">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">Henüz Siparişiniz Yok</h4>
                <p className="text-gray-500 mb-6">Vitrin&apos;deki binlerce ürün sizi bekliyor.</p>
                <Link href="/products" className="inline-block bg-gray-900 text-white font-bold px-6 py-3 rounded-xl hover:bg-gray-800 transition shadow-md">
                  Alışverişe Başla
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {userOrders.map((order) => (
                  <div key={order.id} className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    
                    {/* SİPARİŞ KARTI ÜST BİLGİ */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-gray-50 pb-6">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 sm:gap-12 w-full sm:w-auto">
                        <div>
                          <p className="text-[11px] text-gray-400 uppercase font-extrabold tracking-widest mb-1">Sipariş No</p>
                          <p className="font-mono font-bold text-gray-900">#{order.id.slice(-8).toUpperCase()}</p>
                        </div>
                        <div>
                          <p className="text-[11px] text-gray-400 uppercase font-extrabold tracking-widest mb-1">Tarih</p>
                          <p className="font-bold text-gray-900">{new Date(order.createdAt).toLocaleDateString("tr-TR")}</p>
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <p className="text-[11px] text-gray-400 uppercase font-extrabold tracking-widest mb-1">Tutar</p>
                          <p className="font-extrabold text-blue-600">{order.totalPrice.toLocaleString("tr-TR")} ₺</p>
                        </div>
                      </div>
                      
                      <div className="w-full sm:w-auto">
                        <Link href={`/profile/orders/${order.id}`} className="flex items-center justify-center gap-2 w-full bg-blue-50 text-blue-700 font-bold px-5 py-2.5 rounded-xl hover:bg-blue-100 transition-colors">
                          Sipariş Detayı
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </Link>
                      </div>
                    </div>

                    {/* SİPARİŞ İÇERİĞİ */}
                    <div className="mb-6">
                      <div className="flex flex-wrap gap-2">
                        {order.items.map(item => (
                          <span key={item.id} className="bg-gray-50 border border-gray-100 px-4 py-2 rounded-xl text-sm text-gray-800 font-semibold flex items-center gap-2">
                            {item.product?.name || "Silinmiş Ürün"} 
                            <span className="bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded text-xs">x{item.quantity}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    {/* SİPARİŞ DURUMU ÇUBUĞU */}
                    <OrderProgressBar status={order.status} />
                    
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ADRES YÖNETİMİ MODÜLÜ */}
          <div className="pt-4">
            <h3 className="text-2xl font-extrabold text-gray-900 flex items-center gap-3 border-b border-gray-100 pb-4 mb-6">
              <span className="bg-green-50 text-green-600 p-2 rounded-xl">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </span>
              Kayıtlı Adreslerim
            </h3>
            <AddressManager initialAddresses={userAddresses} />
          </div>

        </div>
      </div>
    </div>
  );
}