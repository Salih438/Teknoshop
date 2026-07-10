// app/admin/brands/page.tsx
import { prisma } from "@/lib/prisma";
import BrandForm from "./BrandForm";
import { Toaster } from "react-hot-toast";

export const dynamic = "force-dynamic";

export default async function AdminBrandsPage() {
  // Markaları, onlara ait ürün sayısıyla birlikte çekiyoruz
  const brands = await prisma.brand.findMany({
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
        <h1 className="text-3xl font-bold text-gray-800">Marka Yönetimi</h1>
        <p className="text-gray-500 mt-2">Sistemdeki markaları buradan ekleyebilir ve yönetebilirsiniz.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* SOL TARAF */}
        <div className="lg:col-span-1">
          <BrandForm />
        </div>

        {/* SAĞ TARAF */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-500 uppercase tracking-wider">
                <th className="p-4 font-medium">Marka Adı</th>
                <th className="p-4 font-medium text-center">Bağlı Ürün</th>
                <th className="p-4 font-medium text-center">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {brands.map((brand) => (
                <tr key={brand.id} className="hover:bg-gray-50 transition">
                  <td className="p-4 font-bold text-gray-900">{brand.name}</td>
                  <td className="p-4 text-center">
                    <span className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-xs font-bold">
                      {brand._count.products} Ürün
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <button className="text-gray-400 hover:text-red-600 transition" title="Sil">🗑️</button>
                  </td>
                </tr>
              ))}
              
              {brands.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-gray-500">
                    Henüz hiç marka eklenmemiş.
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