import { requireAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";

import Image from "next/image";
// app/admin/products/page.tsx
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import DeleteButton from "./DeleteButton"; // Kendi oluşturduğun silme bileşenini koruyoruz

export const dynamic = "force-dynamic";

export default async function AdminProductsPage({
  searchParams,
}: {
  // GÜNCELLEME 1: searchParams artık bir Promise olarak tanımlandı
  searchParams: Promise<{ q?: string; category?: string; brand?: string }>;
}) {
  try {
    await requireAdmin();
  } catch {
    redirect("/");
  }

  // GÜNCELLEME 2: URL'den gelen parametreleri "await" ile bekleyerek çözümlüyoruz
  const resolvedParams = await searchParams;
  const query = resolvedParams?.q || "";
  const categoryId = resolvedParams?.category || "";
  const brandId = resolvedParams?.brand || "";

  // 2. Prisma için Dinamik Filtreleme Koşulu (Gelen verilere göre şekillenir)
  const whereCondition: { name?: { contains: string; mode: 'insensitive' }; categoryId?: string; brandId?: string } = {};
  if (query) {
    whereCondition.name = { contains: query, mode: "insensitive" };
  }
  if (categoryId) {
    whereCondition.categoryId = categoryId;
  }
  if (brandId) {
    whereCondition.brandId = brandId;
  }

  // 3. Veritabanından İhtiyacımız Olan Tüm Verileri Tek Seferde (Paralel) Çekiyoruz
  const [products, categories, brands, totalCount] = await Promise.all([
    prisma.product.findMany({
      where: whereCondition,
      include: {
        category: true,
        brand: true,
        images: true,
        variants: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.brand.findMany({ orderBy: { name: "asc" } }),
    prisma.product.count({ where: whereCondition }),
  ]);

  return (
    <div className="space-y-6">
      
      {/* ÜST KISIM: Başlık ve Yeni Ürün Ekle Butonu */}
      <div className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Ürün Yönetimi</h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">
            Toplam <span className="text-blue-600 font-bold">{totalCount}</span> ürün listeleniyor.
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition shadow-sm flex items-center gap-2"
        >
          <span>➕</span> Yeni Ürün Ekle
        </Link>
      </div>

      {/* ARAMA VE FİLTRELEME ÇUBUĞU */}
      <form className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4 items-center mb-6">
        {/* Arama Kutusu */}
        <div className="flex-1 w-full relative">
          <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Ürün adı ara..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        {/* Kategori Filtresi */}
        <select name="category" defaultValue={categoryId} className="w-full md:w-auto px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
          <option value="">Tüm Kategoriler</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        {/* Marka Filtresi */}
        <select name="brand" defaultValue={brandId} className="w-full md:w-auto px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
          <option value="">Tüm Markalar</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>

        {/* Aksiyon Butonları */}
        <button type="submit" className="w-full md:w-auto bg-gray-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-800 transition">
          Filtrele
        </button>
        {(query || categoryId || brandId) && (
          <Link href="/admin/products" className="text-gray-500 hover:text-red-500 font-medium px-2 transition">
            Temizle
          </Link>
        )}
      </form>

      {/* TABLO KISMI */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-500 uppercase tracking-wider">
                <th className="p-4 font-medium w-16">Görsel</th>
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
                  <tr key={product.id} className="hover:bg-gray-50 transition group">
                    
                    {/* Görsel Sütunu */}
                    <td className="p-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center border border-gray-200">
                        {mainImage ? (
                          <Image src={mainImage} alt={product.name} className="w-full h-full object-cover" width={500} height={500} />
                        ) : (
                          <span className="text-xs text-gray-400">Yok</span>
                        )}
                      </div>
                    </td>

                    {/* Ürün Adı, SKU ve Aktiflik Durumu */}
                    <td className="p-4">
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {product.sku ? `SKU: ${product.sku}` : "SKU Yok"} • {product.isActive ? "🟢 Aktif" : "🔴 Pasif"}
                      </p>
                    </td>

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
                      {(() => {
                        const hasVariants = product.variants && product.variants.length > 0;
                        const displayStock = hasVariants 
                          ? product.variants.reduce((acc, v) => acc + v.stock, 0)
                          : product.stock;
                          
                        return displayStock > 10 ? (
                          <span className="text-green-600 font-medium">{displayStock} Adet</span>
                        ) : displayStock > 0 ? (
                          <span className="text-orange-500 font-medium">Son {displayStock} Adet!</span>
                        ) : (
                          <span className="text-red-600 font-bold">Stokta Yok</span>
                        );
                      })()}
                    </td>

                    {/* Fiyat */}
                    <td className="p-4 font-bold text-gray-900">
                      {product.price.toLocaleString("tr-TR")} ₺
                    </td>

                    {/* İşlemler */}
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-3">
                        <Link href={`/products/${product.id}`} target="_blank" className="text-gray-400 hover:text-blue-600 transition" title="Vitrinde Gör">
                          👁️
                        </Link>
                        <Link href={`/admin/products/${product.id}/edit`} className="text-gray-400 hover:text-green-600 transition" title="Düzenle">
                          ✏️
                        </Link>
                        
                        {/* Harici silme bileşenin */}
                        <DeleteButton id={product.id} />
                      </div>
                    </td>

                  </tr>
                );
              })}

              {/* Arama Sonucu Boş Dönerse */}
              {products.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-gray-500">
                    <p className="text-4xl mb-3">🔍</p>
                    <p className="font-medium text-lg text-gray-900">Ürün bulunamadı</p>
                    <p>Farklı bir arama yapmayı veya yeni ürün eklemeyi deneyin.</p>
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