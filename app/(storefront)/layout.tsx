import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AuthCartSync from "@/components/AuthCartSync";
import AnnouncementBar from "@/components/AnnouncementBar";
import { prisma } from "@/lib/prisma";

export default async function StorefrontLayout({ children }: { children: React.ReactNode }) {
  const categories = await prisma.category.findMany({
    select: {
      id: true,
      name: true,
      _count: {
        select: { products: { where: { isActive: true } } },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <>
      <AuthCartSync />
      <div className="flex flex-col min-h-screen overflow-x-hidden">
        <AnnouncementBar />
        <Navbar categories={categories} />
        <main className="flex-1 max-w-7xl mx-auto p-4 w-full">
          {children}
        </main>
        <Footer />
      </div>
    </>
  );
}
