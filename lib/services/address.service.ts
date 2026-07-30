// Dosya: lib/services/address.service.ts
import { prisma } from "@/lib/prisma";

export const AddressService = {
  // Kullanıcının adreslerini getirme
  async getUserAddresses(userId: string) {
    return await prisma.address.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  },

  // Yeni adres ekleme
  async createAddress(userId: string, data: { title: string; city: string; district: string; address: string; isDefault?: boolean }) {
    return await prisma.$transaction(async (tx) => {
      if (data.isDefault) {
        await tx.address.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false },
        });
      }

      const existingCount = await tx.address.count({ where: { userId } });
      const finalIsDefault = existingCount === 0 ? true : (data.isDefault || false);

      return await tx.address.create({
        data: {
          title: data.title,
          city: data.city,
          district: data.district,
          address: data.address,
          isDefault: finalIsDefault,
          userId,
        },
      });
    });
  },

  // 🚀 YENİ EKLENEN: Adres Silme İşlemi
  async deleteAddress(addressId: string, userId: string) {
    // 1. GÜVENLİK DUVARI: Adres bu kullanıcıya mı ait? (IDOR Koruması)
    const address = await prisma.address.findUnique({ 
      where: { id: addressId },
      select: { userId: true } 
    });
    
    if (!address || address.userId !== userId) {
      throw new Error("UNAUTHORIZED"); // Yetki hatası fırlat
    }

    // 2. SİPARİŞ KONTROLÜ: Bu adrese bağlı verilmiş sipariş var mı kontrol et
    const orderCount = await prisma.order.count({
      where: { addressId: addressId }
    });

    if (orderCount > 0) {
      throw new Error("HAS_ORDERS"); // Sipariş çakışması hatası fırlat
    }

    // 3. Güvenle Sil
    return await prisma.address.delete({
      where: { id: addressId },
    });
  }
};