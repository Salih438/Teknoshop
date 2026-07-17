"use server";

import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function toggleFavorite(productId: string) {
  try {
    const clerkUser = await currentUser();
    
    if (!clerkUser) {
      return { success: false, error: "Giriş yapmanız gerekiyor." };
    }

    const email = clerkUser.emailAddresses[0]?.emailAddress;

    if (!email) {
      return { success: false, error: "E-posta bulunamadı." };
    }

    // OPTİMİZASYON 1: findUnique ve create yerine tek sorgu (upsert)
    // Bu, veritabanı trafiğini yarı yarıya düşürür.
    const dbUser = await prisma.user.upsert({
      where: { email },
      update: {}, // Kullanıcı varsa hiçbir şeyi güncelleme, sadece getir
      create: {
        id: clerkUser.id,
        email: email,
        name: clerkUser.fullName || "Kullanıcı", // Clerk'in fullName metodunu kullanmak daha temizdir
        avatarUrl: clerkUser.imageUrl,
      },
    });

    // Doğru kullanıcı ID'si ile favoriyi kontrol et
    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId: dbUser.id,
          productId: productId,
        },
      },
    });

    let isFavorite = false;

    // OPTİMİZASYON 2: İşlem blokları sadeleştirildi
    if (existingFavorite) {
      await prisma.favorite.delete({
        where: { id: existingFavorite.id },
      });
    } else {
      await prisma.favorite.create({
        data: {
          userId: dbUser.id,
          productId: productId,
        },
      });
      isFavorite = true; // Sadece yeni eklendiyse true yap
    }

    // OPTİMİZASYON 3: Revalidate (önbellek temizleme) işlemleri tek bir yere toplandı
    revalidatePath("/products");
    revalidatePath(`/products/${productId}`);
    revalidatePath("/favorites");
    
    return { success: true, isFavorite };
    
  } catch (error) {
    console.error("Favori işlemi hatası:", error);
    return { success: false, error: "Bir hata oluştu." };
  }
}