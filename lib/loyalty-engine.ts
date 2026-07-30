import { prisma } from "@/lib/prisma";

export type LoyaltyTier = "BRONZE" | "SILVER" | "GOLD" | "VIP";

export interface TierInfo {
  name: string;
  tier: LoyaltyTier;
  icon: string;
  badgeBg: string;
  badgeText: string;
  minPoints: number;
  maxPoints: number;
  bonusRate: number;
  perks: string[];
}

export const LOYALTY_TIERS: Record<LoyaltyTier, TierInfo> = {
  BRONZE: {
    name: "Bronz Üye",
    tier: "BRONZE",
    icon: "🥉",
    badgeBg: "bg-amber-100",
    badgeText: "text-amber-900 border-amber-300",
    minPoints: 0,
    maxPoints: 1000,
    bonusRate: 1.0,
    perks: ["Her 100 TL alışverişe 10 Puan", "Doğum gününe özel sürpriz kupon"],
  },
  SILVER: {
    name: "Gümüş Üye",
    tier: "SILVER",
    icon: "🥈",
    badgeBg: "bg-slate-100",
    badgeText: "text-slate-800 border-slate-300",
    minPoints: 1001,
    maxPoints: 3000,
    bonusRate: 1.05,
    perks: ["%5 Ekstra Puan Kazanımı", "Öncelikli Müşteri Desteği", "Sadece Üyelere Özel Flaş İndirimler"],
  },
  GOLD: {
    name: "Altın Üye",
    tier: "GOLD",
    icon: "🥇",
    badgeBg: "bg-yellow-100",
    badgeText: "text-yellow-900 border-yellow-400",
    minPoints: 3001,
    maxPoints: 7500,
    bonusRate: 1.1,
    perks: ["Tüm Siparişlerde Koşulsuz ÜCRETSİZ KARGO", "%10 Ekstra Puan Kazanımı", "Erken Erişim Fırsatları"],
  },
  VIP: {
    name: "VIP Üye",
    tier: "VIP",
    icon: "💎",
    badgeBg: "bg-purple-100",
    badgeText: "text-purple-900 border-purple-300",
    minPoints: 7501,
    maxPoints: Infinity,
    bonusRate: 1.15,
    perks: ["Birebir VIP Müşteri Temsilcisi", "%15 Ekstra Puan Kazanımı", "Özel Hedefli VIP Etkinlik Davetiyeleri"],
  },
};

/**
 * Kullanıcının Toplam Harcamasından Sadakat Puanını ve Seviyesini (Tier) Hesaplar
 */
export async function getUserLoyaltyData(userId: string) {
  try {
    const orders = await prisma.order.findMany({
      where: { userId, status: { not: "CANCELLED" } },
      select: { totalPrice: true, createdAt: true, id: true },
      orderBy: { createdAt: "desc" },
    });

    const totalSpent = orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
    const basePoints = Math.floor(totalSpent / 10); // Her 100 TL = 10 Puan (10 TL = 1 Puan)

    let currentTier: LoyaltyTier = "BRONZE";
    if (basePoints > 7500) currentTier = "VIP";
    else if (basePoints > 3000) currentTier = "GOLD";
    else if (basePoints > 1000) currentTier = "SILVER";

    const tierInfo = LOYALTY_TIERS[currentTier];
    const totalPoints = Math.floor(basePoints * tierInfo.bonusRate);

    // Bir Sonraki Seviye İlerleme Hesabı
    let nextTier: TierInfo | null = null;
    let progressPercentage = 100;
    let remainingPointsForNextTier = 0;

    if (currentTier === "BRONZE") nextTier = LOYALTY_TIERS.SILVER;
    else if (currentTier === "SILVER") nextTier = LOYALTY_TIERS.GOLD;
    else if (currentTier === "GOLD") nextTier = LOYALTY_TIERS.VIP;

    if (nextTier) {
      const range = nextTier.minPoints - tierInfo.minPoints;
      const currentProgress = totalPoints - tierInfo.minPoints;
      progressPercentage = Math.min(100, Math.max(0, Math.floor((currentProgress / range) * 100)));
      remainingPointsForNextTier = Math.max(0, nextTier.minPoints - totalPoints);
    }

    const referralCode = `VITRIN-${userId.slice(-6).toUpperCase()}`;

    return {
      totalSpent,
      totalPoints,
      currentTier: tierInfo,
      nextTier,
      progressPercentage,
      remainingPointsForNextTier,
      referralCode,
      recentOrdersCount: orders.length,
    };
  } catch (error) {
    console.error("Loyalty Engine Error:", error);
    return {
      totalSpent: 0,
      totalPoints: 0,
      currentTier: LOYALTY_TIERS.BRONZE,
      nextTier: LOYALTY_TIERS.SILVER,
      progressPercentage: 0,
      remainingPointsForNextTier: 1001,
      referralCode: "VITRIN-MEMBER",
      recentOrdersCount: 0,
    };
  }
}
