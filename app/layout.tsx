import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";

// 🚀 YENİ: Lazy Sync için gerekli importlar
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Teknoshop | Teknoloji ve Elektronik Mağazası",
  description: "En yeni teknoloji ürünleri ve elektronik cihazlar",
};

// 🚀 YENİ: Layout'u async yaptık ki sunucu tarafında Prisma'yı bekleyebilelim
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  // --- LAZY SYNC (GÖRÜNMEZ SENKRONİZASYON) BAŞLANGICI ---
  const clerkUser = await currentUser();

  if (clerkUser) {
    const email = clerkUser.emailAddresses[0].emailAddress;
    
    const dbUser = await prisma.user.findUnique({
      where: { email },
    });

    // Kullanıcı Clerk'te var ama bizim veritabanımızda (Prisma) yoksa sessizce oluştur
    if (!dbUser) {
      await prisma.user.create({
        data: {
          email: email,
          name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || "Değerli Müşterimiz",
          avatarUrl: clerkUser.imageUrl || null,
          role: "USER", 
        },
      });
    }
  }
  // --- LAZY SYNC BİTİŞİ ---

  return (
    // ClerkProvider'ı html etiketinin dışına almak en stabil yöntemdir
    <ClerkProvider>
      <html lang="tr" suppressHydrationWarning>
        {/* suppressHydrationWarning özelliği ile tarayıcı eklentilerinin 
          (ColorZilla vb.) body'ye yaptığı müdahaleleri susturuyoruz.
        */}
        <body className={`${inter.className} bg-gray-50 text-gray-900`} suppressHydrationWarning>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}