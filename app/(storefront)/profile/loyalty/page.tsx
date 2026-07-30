import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getUserLoyaltyData, LOYALTY_TIERS } from "@/lib/loyalty-engine";
import Link from "next/link";
import ReferralCopyCard from "@/components/loyalty/ReferralCopyCard";

export const dynamic = "force-dynamic";

export default async function LoyaltyPage() {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect("/");

  const email = clerkUser.emailAddresses[0]?.emailAddress;
  if (!email) redirect("/");

  const dbUser = await prisma.user.findUnique({ where: { email } });
  if (!dbUser) redirect("/");

  const loyalty = await getUserLoyaltyData(dbUser.id);

  return (
    <main className="min-h-screen bg-gray-50/50 py-8 px-4 sm:px-6 lg:px-8 w-full text-left">
      <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
        
        {/* ÜST GEZİNME VE BAŞLIK BARI */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <Link href="/profile" className="text-xs font-bold text-gray-500 hover:text-blue-600">
                ← Hesabım
              </Link>
              <span className="text-gray-300">/</span>
              <span className="text-xs font-bold text-blue-600">Sadakat & Ödüllerim</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mt-1">
              Vitrin Club & Ödüller 🎁
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-4 py-2 rounded-2xl font-black text-xs sm:text-sm border shadow-2xs ${loyalty.currentTier.badgeBg} ${loyalty.currentTier.badgeText}`}>
              {loyalty.currentTier.icon} {loyalty.currentTier.name}
            </span>
          </div>
        </div>

        {/* 🚀 SADAKAT PUANI VE İLERLEME KARTI */}
        <div className="bg-gradient-to-tr from-gray-900 via-slate-800 to-gray-900 text-white p-8 sm:p-10 rounded-3xl shadow-xl space-y-6 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
            <div className="space-y-1">
              <span className="text-xs font-extrabold text-gray-400 uppercase tracking-widest block">TOPLAM SADAKAT PUANINIZ</span>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl sm:text-6xl font-black text-amber-400 font-mono tracking-tight">
                  {loyalty.totalPoints.toLocaleString("tr-TR")}
                </span>
                <span className="text-sm font-bold text-gray-300">Vitrin Puan</span>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 text-xs font-medium space-y-1 sm:text-right">
              <span className="text-gray-300 block">Toplam Alışveriş Tutarı:</span>
              <span className="text-lg font-black text-white">{loyalty.totalSpent.toLocaleString("tr-TR")} ₺</span>
            </div>
          </div>

          {/* İLERLEME ÇUBUĞU */}
          {loyalty.nextTier && (
            <div className="space-y-2 pt-4 border-t border-white/10 relative z-10">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-gray-300 flex items-center gap-1">
                  Mevcut: <strong>{loyalty.currentTier.name}</strong>
                </span>
                <span className="text-amber-400 font-black">
                  {loyalty.nextTier.name} Seviyesine {loyalty.remainingPointsForNextTier.toLocaleString("tr-TR")} Puan Kaldı 🚀
                </span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-3.5 p-0.5 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full transition-all duration-700"
                  style={{ width: `${loyalty.progressPercentage}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* 🚀 REFERANS KODU İLE KAZAN (DAVET ET & KAZAN) */}
        <ReferralCopyCard referralCode={loyalty.referralCode} />

        {/* 🚀 SEVİYE VE AVANTAJLAR KARŞILAŞTIRMA KARTLARI */}
        <div className="space-y-4">
          <h2 className="text-xl font-black text-gray-900">Seviye Avantajları & Üyelik Ayrıcalıkları</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.values(LOYALTY_TIERS).map((t) => {
              const isCurrent = t.tier === loyalty.currentTier.tier;
              return (
                <div
                  key={t.tier}
                  className={`p-5 rounded-3xl border-2 transition-all flex flex-col justify-between space-y-4 relative ${
                    isCurrent
                      ? "border-blue-600 bg-blue-50/40 shadow-md ring-2 ring-blue-600/20"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  {isCurrent && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-black uppercase px-3 py-0.5 rounded-full shadow-xs">
                      Mevcut Seviyeniz
                    </span>
                  )}

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-2xl">{t.icon}</span>
                      <span className="text-[10px] font-extrabold uppercase bg-gray-100 px-2 py-0.5 rounded-md text-gray-600">
                        {t.minPoints} - {t.maxPoints === Infinity ? "∞" : t.maxPoints} Puan
                      </span>
                    </div>

                    <h3 className="font-black text-base text-gray-900">{t.name}</h3>
                  </div>

                  <ul className="space-y-1.5 text-xs text-gray-600 font-medium">
                    {t.perks.map((perk, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-green-600 font-black">✓</span>
                        <span>{perk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </main>
  );
}
