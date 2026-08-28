// Dosya: lib/services/address.service.ts
import { prisma } from "@/lib/prisma";

export interface AddressInputDTO {
  title: string;
  city: string;
  district: string;
  address: string;
  isDefault?: boolean;
}

export const AddressService = {
  // Kullanıcının adreslerini getirme
  async getUserAddresses(userId: string) {
    return await prisma.address.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  },

  // Yeni adres ekleme
  async createAddress(userId: string, data: AddressInputDTO) {
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
          title: data.title.trim(),
          city: data.city.trim(),
          district: data.district.trim(),
          address: data.address.trim(),
          isDefault: finalIsDefault,
          userId,
        },
      });
    });
  },

  // Adres Güncelleme İşlemi (In-place edit + IDOR koruması + Default adres yönetimi)
  async updateAddress(addressId: string, userId: string, data: AddressInputDTO) {
    return await prisma.$transaction(async (tx) => {
      // 1. GÜVENLİK DUVARI: Adres bu kullanıcıya mı ait? (IDOR Koruması)
      const existingAddress = await tx.address.findUnique({
        where: { id: addressId },
        select: { id: true, userId: true, isDefault: true },
      });

      if (!existingAddress || existingAddress.userId !== userId) {
        throw new Error("UNAUTHORIZED");
      }

      // 2. Varsayılan Adres Mantığı
      if (data.isDefault) {
        await tx.address.updateMany({
          where: { userId, id: { not: addressId } },
          data: { isDefault: false },
        });
      }

      // 3. Adresi Güncelle
      const updated = await tx.address.update({
        where: { id: addressId },
        data: {
          title: data.title.trim(),
          city: data.city.trim(),
          district: data.district.trim(),
          address: data.address.trim(),
          ...(data.isDefault !== undefined ? { isDefault: data.isDefault } : {}),
        },
      });

      return updated;
    });
  },

  // Adres Silme İşlemi (Otomatik varsayılan adres terfi ettirme ile)
  async deleteAddress(addressId: string, userId: string) {
    return await prisma.$transaction(async (tx) => {
      // 1. GÜVENLİK DUVARI: Adres bu kullanıcıya mı ait? (IDOR Koruması)
      const address = await tx.address.findUnique({ 
        where: { id: addressId },
        select: { userId: true, isDefault: true } 
      });
      
      if (!address || address.userId !== userId) {
        throw new Error("UNAUTHORIZED");
      }

      // 2. SİPARİŞ KONTROLÜ: Bu adrese bağlı verilmiş sipariş var mı kontrol et
      const orderCount = await tx.order.count({
        where: { addressId: addressId }
      });

      if (orderCount > 0) {
        throw new Error("HAS_ORDERS");
      }

      // 3. Adresi Sil
      await tx.address.delete({
        where: { id: addressId },
      });

      // 4. Varsayılan Adres Terfi Ettirme: Silinen adres varsayılan ise en güncel kalanı varsayılan yap
      if (address.isDefault) {
        const newestRemaining = await tx.address.findFirst({
          where: { userId },
          orderBy: { createdAt: "desc" },
        });

        if (newestRemaining) {
          await tx.address.update({
            where: { id: newestRemaining.id },
            data: { isDefault: true },
          });
        }
      }

      return true;
    });
  }
};