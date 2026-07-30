import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import ProfileStats from "@/components/profile/ProfileStats";
import EditProfileModal from "@/components/profile/EditProfileModal";
import ProfileTabContainer from "@/components/profile/ProfileTabContainer";
import { ReturnService } from "@/lib/services/return.service";
import { ExchangeService } from "@/lib/services/exchange.service";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect("/");

  const email = clerkUser.emailAddresses[0].emailAddress;

  let dbUser = await prisma.user.findUnique({
    where: { email },
  });

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

  const userOrders = await prisma.order.findMany({
    where: { userId: dbUser.id },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: { product: { select: { name: true } } }
      }
    }
  });

  const userAddresses = await prisma.address.findMany({
    where: { userId: dbUser.id },
    orderBy: { createdAt: "desc" }
  });

  const userReturns = await ReturnService.getUserReturnRequests(dbUser.id);
  const userExchanges = await ExchangeService.getUserExchangeRequests(dbUser.id);

  const totalOrders = userOrders.length;
  const totalSpent = userOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
  const deliveredOrders = userOrders.filter(order => order.status === "DELIVERED").length;
  const favoritesCount = await prisma.favorite.count({ where: { userId: dbUser.id } });

  const profileImage = dbUser.avatarUrl || clerkUser.imageUrl;

  return (
    <div className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 min-h-screen animate-in fade-in duration-500 w-full overflow-x-clip">
      
      {/* BAŞLIK VE PROFİL DÜZENLEME MODALI */}
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4 sm:pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Hesabım</h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-1 font-medium">Kişisel bilgilerinizi, adreslerinizi ve sipariş geçmişinizi sekmelerden yönetin.</p>
        </div>
        <EditProfileModal 
          initialName={dbUser.name} 
          initialPhone={dbUser.phone} 
          email={dbUser.email} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        
        {/* SOL KOLON: KULLANICI BİLGİLERİ KARTI */}
        <div className="lg:col-span-4 xl:col-span-3">
          <div className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl shadow-xs border border-gray-100 lg:sticky lg:top-28">
            
            <div className="w-20 h-20 sm:w-28 sm:h-28 mx-auto mb-4 sm:mb-5 rounded-full flex items-center justify-center overflow-hidden border-4 border-white shadow-md relative bg-gray-50">
              {profileImage ? (
                <Image src={profileImage} 
                  alt={dbUser.name} 
                  className="w-full h-full object-cover"
                width={500} height={500} />
              ) : (
                <span className="text-blue-600 text-3xl sm:text-4xl font-extrabold">
                  {dbUser.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            <div className="text-center mb-5">
              <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 truncate">{dbUser.name}</h2>
              <p className="text-gray-500 text-xs sm:text-sm font-medium mt-0.5 truncate">{dbUser.email}</p>
            </div>
            
            <div className="space-y-3 pt-4 border-t border-gray-100 text-xs sm:text-sm">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2 text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  <span className="font-bold">Telefon</span>
                </div>
                <span className="font-extrabold text-gray-900">{dbUser.phone || "Eklenmemiş"}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2 text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  <span className="font-bold">Kayıt Tarihi</span>
                </div>
                <span className="font-extrabold text-gray-900">{new Date(dbUser.createdAt).toLocaleDateString("tr-TR")}</span>
              </div>
            </div>
          </div>
        </div>

        {/* SAĞ KOLON: İSTATİSTİKLER VE SEKMELİ İÇERİK KAPSAYICISI */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-6 sm:space-y-8">
          
          <ProfileStats 
            totalOrders={totalOrders} 
            totalSpent={totalSpent} 
            deliveredOrders={deliveredOrders} 
            favoritesCount={favoritesCount} 
          />

          {/* SEKMELİ PROFİL İÇERİĞİ */}
          <ProfileTabContainer
            user={{
              id: dbUser.id,
              name: dbUser.name,
              email: dbUser.email,
              phone: dbUser.phone,
              createdAt: dbUser.createdAt,
            }}
            orders={userOrders}
            addresses={userAddresses}
            returns={userReturns}
            exchanges={userExchanges}
          />

        </div>
      </div>
    </div>
  );
}