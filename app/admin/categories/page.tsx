// app/admin/categories/page.tsx
import { requireAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import CategoryForm from "./CategoryForm";
import { Toaster } from "react-hot-toast";
import DeleteCategoryButton from "./DeleteCategoryButton";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/");
  }

  // Kategorileri, içlerinde kaç adet ürün olduğu bilgisiyle (include) birlikte çekiyoruz
  const categories = await prisma.category.findMany({
    include: {
      _count: {
        select: { products: true }
      }
    },
    orderBy: { name: "asc" }
  });

  return (
    <div>
      <Toaster position="bottom-right" />
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Kategori Yönetimi</h1>
        <p className="text-gray-500 mt-2">Ürünlerinizi sınıflandırmak için yeni kategoriler ekleyin.</p>
      </div>

      {/* İKİYE BÖLÜNMÜŞ EKRAN TASARIMI (Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* SOL TARAF: Form Bileşeni (1 Birim) */}
        <div className="lg:col-span-1">
          <CategoryForm />
        </div>

        {/* SAĞ TARAF: Kategoriler Tablosu (2 Birim) */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-500 uppercase tracking-wider">
                <th className="p-4 font-medium">Kategori Adı</th>
                <th className="p-4 font-medium">Açıklama</th>
                <th className="p-4 font-medium text-center">Bağlı Ürün</th>
                <th className="p-4 font-medium text-center">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {categories.map((category) => (
                <tr key={category.id} className="hover:bg-gray-50 transition">
                  <td className="p-4 font-bold text-gray-900">{category.name}</td>
                  <td className="p-4 text-sm text-gray-500 truncate max-w-[200px]">
                    {category.description || "-"}
                  </td>
                  <td className="p-4 text-center">
                    <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">
                      {category._count.products} Ürün
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    {/* İŞTE DÜZELTİLEN KISIM BURASI: Gerçek işlevsel bileşenimizi buraya koyduk */}
                    <DeleteCategoryButton id={category.id} />
                  </td>
                </tr>
              ))}
              
              {categories.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">
                    Henüz hiç kategori eklenmemiş. Soldaki formu kullanarak ilk kategorinizi oluşturun.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}