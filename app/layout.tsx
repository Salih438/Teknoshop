import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { trTR } from "@clerk/localizations";

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
    <ClerkProvider
      localization={trTR}
      appearance={{
        options: {
          socialButtonsVariant: "blockButton",
          socialButtonsPlacement: "bottom",
          showOptionalFields: false,
        },
        variables: {
          colorPrimary: "#2563eb",
          colorForeground: "#1f2937",
          colorMutedForeground: "#4b5563",
          colorBackground: "#ffffff",
          colorInput: "#ffffff",
          colorInputForeground: "#1f2937",
          colorDanger: "#e11d48",
          colorSuccess: "#16a34a",
          colorWarning: "#d97706",
          colorBorder: "#e5e7eb",
          fontFamily: "inherit",
          borderRadius: "0.75rem",
        },
        elements: {
          card: "shadow-2xl border border-gray-200 rounded-2xl bg-white",
          navbar: "border-r border-gray-100",
          headerTitle: "text-gray-900 font-extrabold tracking-tight",
          headerSubtitle: "text-gray-500 font-medium text-xs sm:text-sm",
          formButtonPrimary:
            "bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-md hover:shadow-lg transition-all min-h-[44px] text-xs sm:text-sm",
          formButtonReset:
            "text-blue-600 hover:bg-blue-50 font-bold rounded-xl text-xs sm:text-sm min-h-[44px]",
          formFieldInput:
            "border border-gray-200 rounded-xl focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 font-medium text-gray-900 min-h-[44px] text-xs sm:text-sm",
          formFieldLabel: "text-gray-700 font-bold text-xs",
          socialButtonsBlockButton:
            "border border-gray-200 hover:bg-gray-50 rounded-xl font-bold text-gray-700 min-h-[44px] text-xs sm:text-sm transition-colors",
          socialButtonsBlockButtonText: "font-bold text-gray-700",
          footerActionLink: "text-blue-600 hover:text-blue-700 font-bold hover:underline",
          userButtonAvatarBox:
            "w-9 h-9 sm:w-10 sm:h-10 border-2 border-gray-200 hover:border-blue-600 transition-colors rounded-full",
          userButtonPopoverCard: "shadow-2xl border border-gray-100 rounded-2xl bg-white",
          userButtonPopoverActionButtonText: "font-bold text-gray-700 text-xs sm:text-sm",
          userButtonPopoverActionButtonIcon: "text-gray-500",
          userButtonPopoverFooter: "border-t border-gray-100",
        },
      }}
    >
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