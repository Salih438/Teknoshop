// app/admin/page.tsx
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  // Veritabanından gerçek verileri sayıyoruz
  const totalProducts = await prisma.product.count();
  const totalCategories = await prisma.category.count();
  const totalBrands = await prisma.brand.count();
  const totalUsers = await prisma.user.count();

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Dashboard Özeti</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* İSTATİSTİK KARTLARI */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 border-l-4 border-l-blue-500">
          <p className="text-sm font-medium text-gray-500">Toplam Ürün</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{totalProducts}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 border-l-4 border-l-green-500">
          <p className="text-sm font-medium text-gray-500">Toplam Kategori</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{totalCategories}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 border-l-4 border-l-purple-500">
          <p className="text-sm font-medium text-gray-500">Toplam Marka</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{totalBrands}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 border-l-4 border-l-orange-500">
          <p className="text-sm font-medium text-gray-500">Toplam Kullanıcı</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{totalUsers}</p>
        </div>

      </div>
    </div>
  );
}