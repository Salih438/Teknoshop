import { requireAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import ProductForm from "./ProductForm";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/");
  }

  // Prisma Studio ile eklediğimiz Kategori ve Markaları veritabanından çekiyoruz
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  const brands = await prisma.brand.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Yeni Ürün Ekle</h1>
        <p className="text-gray-500 mt-2">Katalog için yeni bir ürün oluşturun.</p>
      </div>
      
      {/* Çektiğimiz verileri forma iletiyoruz */}
      <ProductForm categories={categories} brands={brands} />
    </div>
  );
}