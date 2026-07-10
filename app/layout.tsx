import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "../components/Navbar";
import { CartProvider } from "@/context/CartContext";
import { ClerkProvider } from "@clerk/nextjs";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "E-Ticaret Vitrini",
  description: "Staj Projesi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // ClerkProvider'ı html etiketinin dışına almak en stabil yöntemdir
    <ClerkProvider>
      <html lang="tr" suppressHydrationWarning>
        {/* suppressHydrationWarning özelliği ile tarayıcı eklentilerinin 
          (ColorZilla vb.) body'ye yaptığı müdahaleleri susturuyoruz.
        */}
        <body className={`${inter.className} bg-gray-50 text-gray-900`} suppressHydrationWarning>
          <CartProvider>
            <Navbar />
            <main className="max-w-7xl mx-auto p-4">
              {children}
            </main>
          </CartProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}