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

  const categories = await prisma.category.findMany({
    include: {
      _count: {
        select: { products: true }
      }
    },
    orderBy: { name: "asc" }
  });

  return (
    <div className="space-y-6 w-full overflow-x-clip">
      <Toaster position="bottom-right" />
      
      <div className="mb-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Kategori Yönetimi</h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1 font-medium">Ürünlerinizi sınıflandırmak için yeni kategoriler ekleyin.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        
        {/* SOL TARAF: Form Bileşeni */}
        <div className="lg:col-span-1">
          <CategoryForm />
        </div>

        {/* SAĞ TARAF: Kategoriler Tablosu */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-xs border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wider font-extrabold">
                  <th className="p-3.5">Kategori Adı</th>
                  <th className="p-3.5">Açıklama</th>
                  <th className="p-3.5 text-center">Bağlı Ürün</th>
                  <th className="p-3.5 text-center">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs sm:text-sm">
                {categories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50/80 transition">
                    <td className="p-3.5 font-bold text-gray-900">{category.name}</td>
                    <td className="p-3.5 text-gray-500 truncate max-w-[180px]">
                      {category.description || "-"}
                    </td>
                    <td className="p-3.5 text-center">
                      <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md text-xs font-extrabold">
                        {category._count.products} Ürün
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <DeleteCategoryButton id={category.id} />
                    </td>
                  </tr>
                ))}
                
                {categories.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-500 font-medium">
                      Henüz hiç kategori eklenmemiş. Soldaki formu kullanarak ilk kategorinizi oluşturun.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}