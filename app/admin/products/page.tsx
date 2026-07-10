import { prisma } from "@/lib/prisma";
import Link from "next/link";
import DeleteButton from "./DeleteButton";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  // Ürünleri markası, kategorisi ve resimleriyle birlikte çekiyoruz
  const products = await prisma.product.findMany({
    include: {
      category: true,
      brand: true,
      images: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div>
      {/* ÜST KISIM: Başlık ve Yeni Ürün Ekle Butonu */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Ürün Yönetimi</h1>
        <Link
          href="/admin/products/new"
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition shadow-sm flex items-center gap-2"
        >
          <span>➕</span> Yeni Ürün Ekle
        </Link>
      </div>

      {/* TABLO KISMI */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-500 uppercase tracking-wider">
                <th className="p-4 font-medium">Görsel</th>
                <th className="p-4 font-medium">Ürün Adı</th>
                <th className="p-4 font-medium">Kategori</th>
                <th className="p-4 font-medium">Marka</th>
                <th className="p-4 font-medium">Stok</th>
                <th className="p-4 font-medium">Fiyat</th>
                <th className="p-4 font-medium text-center">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {products.map((product) => {
                // Ürünün ilk resmini alıyoruz, yoksa null
                const mainImage = product.images.length > 0 ? product.images[0].imageUrl : null;

                return (
                  <tr key={product.id} className="hover:bg-gray-50 transition">
                    
                    {/* Görsel Sütunu */}
                    <td className="p-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center border border-gray-200">
                        {mainImage ? (
                          <img src={mainImage} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs text-gray-400">Yok</span>
                        )}
                      </div>
                    </td>

                    {/* Ürün Adı */}
                    <td className="p-4 font-medium text-gray-900">{product.name}</td>

                    {/* Kategori */}
                    <td className="p-4 text-gray-600">
                      <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                        {product.category?.name || "Kategorisiz"}
                      </span>
                    </td>

                    {/* Marka */}
                    <td className="p-4 text-gray-600">
                      <span className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-xs font-medium">
                        {product.brand?.name || "Markasız"}
                      </span>
                    </td>

                    {/* Stok Durumu */}
                    <td className="p-4">
                      {product.stock > 10 ? (
                        <span className="text-green-600 font-medium">{product.stock} Adet</span>
                      ) : product.stock > 0 ? (
                        <span className="text-orange-500 font-medium">Son {product.stock} Adet!</span>
                      ) : (
                        <span className="text-red-600 font-bold">Stokta Yok</span>
                      )}
                    </td>

                    {/* Fiyat */}
                    <td className="p-4 font-bold text-gray-900">
                      {product.price.toLocaleString("tr-TR")} ₺
                    </td>

                    {/* İşlemler */}
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-3">
                        {/* Vitrinde Gör */}
                        <Link href={`/products/${product.id}`} target="_blank" className="text-gray-400 hover:text-blue-600 transition" title="Vitrinde Gör">
                          👁️
                        </Link>
                        {/* Düzenle */}
<Link href={`/admin/products/${product.id}/edit`} className="text-gray-400 hover:text-green-600 transition" title="Düzenle">
  ✏️
</Link>
                        {/* Sil */}
<DeleteButton id={product.id} />
                      </div>
                    </td>

                  </tr>
                );
              })}

              {products.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">
                    Henüz hiç ürün eklenmemiş.
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