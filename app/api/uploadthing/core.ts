import { createUploadthing, type FileRouter } from "uploadthing/next";
import { currentUser } from "@clerk/nextjs/server";

const f = createUploadthing();

export const ourFileRouter = {
  // 1. Rota: Profil Fotoğrafı (Sadece 1 adet, maks 4MB)
  avatarUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async () => {
      const user = await currentUser();
      if (!user) throw new Error("Yetkisiz işlem!");
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Resim yüklendi. Kullanıcı:", metadata.userId);
      console.log("Resim URL'si:", file.url);
      return { uploadedBy: metadata.userId, url: file.url };
    }),

  // 2. Rota: Ürün Fotoğrafları (Maks 5 adet)
  productImageUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 5 } })
    .middleware(async () => {
      const user = await currentUser();
      if (!user) throw new Error("Yetkisiz işlem!");
      return { userId: user.id };
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;