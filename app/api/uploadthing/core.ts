import { createUploadthing, type FileRouter } from "uploadthing/next";
import { currentUser } from "@clerk/nextjs/server";
import { requireAdmin } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limiter";

const f = createUploadthing();

export const ourFileRouter = {
  // 1. Rota: Profil Fotoğrafı (Sadece 1 adet, maks 4MB) - 10 yükleme / 10 dk limiti
  avatarUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async () => {
      const user = await currentUser();
      if (!user) throw new Error("Yetkisiz işlem!");
      const rateLimit = await checkRateLimit(`upload:user:${user.id}`, { limit: 10, windowSeconds: 600 });
      if (!rateLimit.success) throw new Error("Çok fazla dosya yükleme denemesi. Lütfen bekleyip tekrar deneyin.");
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Resim yüklendi. Kullanıcı:", metadata.userId);
      console.log("Resim URL'si:", file.url);
      return { uploadedBy: metadata.userId, url: file.url };
    }),

  // 2. Rota: Ürün Fotoğrafları (Maks 5 adet) - Admin RBAC Korumalı + Rate Limit
  productImageUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 5 } })
    .middleware(async () => {
      const adminUser = await requireAdmin("MANAGE_PRODUCTS");
      const rateLimit = await checkRateLimit(`upload:admin:${adminUser.id}`, { limit: 10, windowSeconds: 600 });
      if (!rateLimit.success) throw new Error("Çok fazla dosya yükleme denemesi. Lütfen bekleyip tekrar deneyin.");
      return { userId: adminUser.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, url: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;