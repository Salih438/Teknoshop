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

  const dbUser = await prisma.user.upsert({
    where: { email },
    update: {
      avatarUrl: clerkUser.imageUrl || undefined,
    },
    create: {
      email: email,
      name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || "Değerli Müşterimiz",
      avatarUrl: clerkUser.imageUrl || null,
      role: "USER",
    },
  });

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
                <span className="text-gray-500 font-bold">Kayıtlı Telefon</span>
                <span className="font-extrabold text-gray-900">{dbUser.phone || "Belirtilmemiş"}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-500 font-bold">Kullanıcı Rolü</span>
                <span className="font-extrabold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-md text-xs">
                  {dbUser.role === "ADMIN" ? "Yönetici" : "Standart Üye"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* SAĞ KOLON: İSTATİSTİKLER VE SEKMELER */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-6">
          <ProfileStats 
            totalOrders={totalOrders}
            deliveredOrders={deliveredOrders}
            totalSpent={totalSpent}
            favoritesCount={favoritesCount}
          />

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