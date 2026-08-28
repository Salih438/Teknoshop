import { prisma } from "@/lib/prisma";
import { Coupon, Prisma } from "@prisma/client";

export interface ValidateCouponResult {
  isValid: boolean;
  coupon?: Coupon;
  discountAmount?: number;
  error?: string;
}

export class CouponService {
  /**
   * Kupon geçerliliğini ve indirim tutarını hesaplar
   */
  static async validateCoupon(
    couponCode: string,
    subTotal: number,
    userId: string
  ): Promise<ValidateCouponResult> {
    const normalizedCode = couponCode.trim().toUpperCase();

    const coupon = await prisma.coupon.findUnique({
      where: { code: normalizedCode },
    });

    if (!coupon) {
      return { isValid: false, error: "Girdiğiniz kupon kodu geçersiz." };
    }

    if (!coupon.isActive || coupon.isDeleted) {
      return { isValid: false, error: "Bu kupon kodu artık aktif değil." };
    }

    if (coupon.expireDate && coupon.expireDate < new Date()) {
      return { isValid: false, error: "Bu kuponun kullanım süresi dolmuş." };
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return { isValid: false, error: "Bu kuponun kullanım limiti dolmuş." };
    }

    if (coupon.minAmount && subTotal < coupon.minAmount) {
      return {
        isValid: false,
        error: `Bu kuponu kullanmak için sepet tutarı en az ${coupon.minAmount} TL olmalıdır.`,
      };
    }

    if (coupon.isSingleUse) {
      const existingUsage = await prisma.couponUsage.findFirst({
        where: {
          couponId: coupon.id,
          userId,
        },
      });

      if (existingUsage) {
        return {
          isValid: false,
          error: "Bu kupon yalnızca bir kez kullanılabilir ve siz zaten kullandınız.",
        };
      }
    }

    const discountAmount = Number(((subTotal * coupon.discount) / 100).toFixed(2));

    return {
      isValid: true,
      coupon,
      discountAmount,
    };
  }

  /**
   * Tüm aktif kuponları listeler
   */
  static async getCoupons(params?: { includeDeleted?: boolean }) {
    return prisma.coupon.findMany({
      where: params?.includeDeleted ? {} : { isDeleted: false },
      orderBy: { expireDate: "desc" },
    });
  }

  /**
   * ID ile kupon getirir
   */
  static async getCouponById(id: string) {
    return prisma.coupon.findUnique({
      where: { id },
    });
  }
}
