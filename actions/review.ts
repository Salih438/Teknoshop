"use server";

import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

// 1. YORUM EKLEME VEYA GÜNCELLEME
export async function submitReview(productId: string, data: { rating: number, comment: string }) {
  try {
    const clerkUser = await currentUser();
    const email = clerkUser?.emailAddresses[0]?.emailAddress;

    if (!clerkUser || !email) return { success: false, error: "Lütfen giriş yapın." };

    const dbUser = await prisma.user.findUnique({ where: { email } });
    if (!dbUser) return { success: false, error: "Kullanıcı kaydınız bulunamadı." };

    await prisma.review.upsert({
      where: {
        userId_productId: {
          userId: dbUser.id,
          productId,
        },
      },
      update: {
        rating: data.rating,
        comment: data.comment,
      },
      create: {
        userId: dbUser.id,
        productId,
        rating: data.rating,
        comment: data.comment,
        isVerified: true, 
      },
    });

    revalidatePath(`/products/${productId}`);
    return { success: true };
  } catch (error) {
    console.error("Yorum kaydetme hatası:", error);
    return { success: false, error: "İşlem sırasında bir hata oluştu." };
  }
}

// 2. ÜRÜN YORUMLARINI ÇEKME
export async function getProductReviews(productId: string) {
  try {
    // Burada include içerisinde 'email' sorgusunu veritabanı performansını 
    // bozmayacak şekilde 'select' ile sınırlandırıyoruz
    return await prisma.review.findMany({
      where: { productId, isHidden: false },
      include: {
        user: {
          select: { name: true, avatarUrl: true, id: true, email: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });
  } catch (error) {
    console.error("Yorum listeleme hatası:", error);
    return [];
  }
}

// 3. YORUM SİLME
export async function deleteReview(productId: string) {
  try {
    const clerkUser = await currentUser();
    const email = clerkUser?.emailAddresses[0]?.emailAddress;

    if (!clerkUser || !email) return { success: false, error: "Giriş yapmanız gerekiyor." };

    const dbUser = await prisma.user.findUnique({ where: { email } });
    if (!dbUser) return { success: false, error: "Kullanıcı bulunamadı." };

    await prisma.review.delete({
      where: {
        userId_productId: {
          userId: dbUser.id,
          productId,
        },
      },
    });

    revalidatePath(`/products/${productId}`);
    return { success: true };
  } catch (error) {
    console.error("Yorum silme hatası:", error);
    return { success: false, error: "Yorum silinemedi, lütfen tekrar deneyin." };
  }
}