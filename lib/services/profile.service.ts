// Dosya: lib/services/profile.service.ts
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

interface UpdateProfileData {
  name: string;
  phone?: string | null;
  avatarUrl?: string;
}

export const ProfileService = {
  // Sadece veritabanı güncelleme işinden sorumlu fonksiyon
  async updateProfile(email: string, data: UpdateProfileData) {
    const updateData: Prisma.UserUpdateInput = {
      name: data.name,
      phone: data.phone || null,
    };
    
    if (data.avatarUrl) {
      updateData.avatarUrl = data.avatarUrl;
    }

    const updatedUser = await prisma.user.update({
      where: { email },
      data: updateData,
    });

    return updatedUser;
  }
};