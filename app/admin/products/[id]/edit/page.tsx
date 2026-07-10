import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import EditProductForm from "./EditProductForm";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const productId = resolvedParams.id;

  // 1. Düzenlenecek ürünün MEVCUT bilgilerini resimleriyle birlikte çekiyoruz
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { images: true }
  });

  // Eğer birisi URL'ye rastgele bir ID yazarsa ve ürün yoksa, ürünler listesine geri yolla
  if (!product) {
    redirect("/admin/products");
  }

  // 2. Kategori ve markaları (Dropdown için) çekiyoruz
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  const brands = await prisma.brand.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Ürünü Düzenle</h1>
        <p className="text-gray-500 mt-2">"{product.name}" isimli ürünü güncelliyorsunuz.</p>
      </div>
      
      {/* Verileri az sonra oluşturacağımız Forma gönderiyoruz */}
      <EditProductForm product={product} categories={categories} brands={brands} />
    </div>
  );
}