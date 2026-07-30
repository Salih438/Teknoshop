"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import QuickStockUpdate from "./QuickStockUpdate";
import QuickPriceUpdate from "./QuickPriceUpdate";
import DeleteButton from "@/app/admin/products/DeleteButton";

export interface CategoryItem {
  id: string;
  name: string;
}

export interface BrandItem {
  id: string;
  name: string;
}

export interface ProductDTO {
  id: string;
  name: string;
  slug: string;
  sku?: string | null;
  price: number;
  comparePrice?: number | null;
  stock: number;
  isActive: boolean;
  imageUrl?: string | null;
  category?: { id: string; name: string } | null;
  brand?: { id: string; name: string } | null;
  createdAt: string;
  variantsCount: number;
}

interface AdminProductsClientProps {
  products: ProductDTO[];
  categories: CategoryItem[];
  brands: BrandItem[];
  totalProducts: number;
  activeCount: number;
  passiveCount: number;
  criticalStockCount: number;
  totalBrands: number;
  totalCategories: number;
}

export default function AdminProductsClient({
  products,
  categories,
  brands,
  totalProducts,
  activeCount,
  passiveCount,
  criticalStockCount,
  totalBrands,
  totalCategories,
}: AdminProductsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  // URL Arama & Filtre Parametreleri
  const searchQuery = searchParams.get("q") || "";
  const categoryFilter = searchParams.get("category") || "";
  const brandFilter = searchParams.get("brand") || "";
  const statusFilter = searchParams.get("status") || "";
  const stockFilter = searchParams.get("stockStatus") || "";
  const pageSize = Number(searchParams.get("limit")) || 10;
  const currentPage = Number(searchParams.get("page")) || 1;

  const [searchInput, setSearchInput] = useState(searchQuery);

  const updateFilters = (newParams: Record<string, string | number | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([key, value]) => {
      if (value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });
    startTransition(() => {
      router.push(`/admin/products?${params.toString()}`);
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ q: searchInput, page: 1 });
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(products.map((p) => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkAction = async (action: string, targetId?: string) => {
    if (selectedIds.length === 0) return;

    if (action === "delete" && !confirm(`${selectedIds.length} ürünü silmek istediğinize emin misiniz?`)) {
      return;
    }

    const toastId = toast.loading(`${selectedIds.length} ürün güncelleniyor...`);
    try {
      const res = await fetch("/api/admin/products/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds: selectedIds, action, targetId }),
      });

      if (res.ok) {
        toast.success("Toplu işlem başarıyla tamamlandı!", { id: toastId });
        setSelectedIds([]);
        router.refresh();
      } else {
        toast.error("Toplu işlem başarısız.", { id: toastId });
      }
    } catch (error) {
      toast.error("Sunucu hatası oluştu.", { id: toastId });
    }
  };

  const handleToggleActive = async (productId: string) => {
    const toastId = toast.loading("Durum değiştiriliyor...");
    try {
      const res = await fetch("/api/admin/products/quick-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggleActive", productId }),
      });

      if (res.ok) {
        toast.success("Ürün aktiflik durumu değiştirildi!", { id: toastId });
        router.refresh();
      } else {
        toast.error("Durum değiştirilemedi.", { id: toastId });
      }
    } catch (error) {
      toast.error("Sunucu hatası.", { id: toastId });
    }
  };

  const handleDuplicateProduct = async (productId: string) => {
    const toastId = toast.loading("Ürün çoğaltılıyor (kopyalanıyor)...");
    try {
      const res = await fetch("/api/admin/products/quick-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "duplicateProduct", productId }),
      });

      if (res.ok) {
        toast.success("Ürün başarıyla kopyalandı!", { id: toastId });
        router.refresh();
      } else {
        toast.error("Ürün çoğaltılamadı.", { id: toastId });
      }
    } catch (error) {
      toast.error("Sunucu hatası.", { id: toastId });
    }
  };

  const totalPages = Math.ceil(products.length / pageSize) || 1;
  const paginatedProducts = products.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6 w-full animate-in fade-in duration-300">
      
      {/* 🚀 ÜST BAŞLIK VE AKSİYONLAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <span>📦</span> Ürün Yönetim Merkezi
          </h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-0.5 font-medium">
            Katalog ürünlerini hızlıca yönetin, stok/fiyat güncelleyin ve ürünleri çoğaltın.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 p-2 rounded-2xl shadow-xs animate-in zoom-in duration-200">
              <span className="text-xs font-black text-blue-900 px-2">{selectedIds.length} Seçildi:</span>
              <button
                onClick={() => handleBulkAction("activate")}
                className="bg-green-600 hover:bg-green-700 text-white font-extrabold px-3 py-1.5 rounded-xl text-xs transition shadow-xs"
              >
                🟢 Aktifleştir
              </button>
              <button
                onClick={() => handleBulkAction("deactivate")}
                className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold px-3 py-1.5 rounded-xl text-xs transition shadow-xs"
              >
                🔴 Pasifleştir
              </button>
              <button
                onClick={() => handleBulkAction("delete")}
                className="bg-red-600 hover:bg-red-700 text-white font-extrabold px-3 py-1.5 rounded-xl text-xs transition shadow-xs"
              >
                🗑 Toplu Sil
              </button>
            </div>
          )}

          <Link
            href="/admin/products/new"
            className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-4 py-2.5 rounded-xl text-xs sm:text-sm transition shadow-sm min-h-[44px] flex items-center gap-1.5"
          >
            <span>➕</span> Yeni Ürün Ekle
          </Link>
        </div>
      </div>

      {/* 🚀 1. ÖZET İSTATİSTİK 6 METRİK KARTI */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-xs border border-gray-200 border-l-4 border-l-blue-600">
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block mb-0.5">Toplam Ürün</span>
          <p className="text-xl sm:text-2xl font-black text-gray-900">{totalProducts}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-xs border border-gray-200 border-l-4 border-l-green-600">
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block mb-0.5">Aktif Ürün</span>
          <p className="text-xl sm:text-2xl font-black text-green-600">{activeCount}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-xs border border-gray-200 border-l-4 border-l-gray-400">
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block mb-0.5">Pasif Ürün</span>
          <p className="text-xl sm:text-2xl font-black text-gray-600">{passiveCount}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-xs border border-gray-200 border-l-4 border-l-red-600">
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block mb-0.5">Kritik Stok</span>
          <p className="text-xl sm:text-2xl font-black text-red-600">{criticalStockCount}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-xs border border-gray-200 border-l-4 border-l-purple-600">
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block mb-0.5">Toplam Marka</span>
          <p className="text-xl sm:text-2xl font-black text-purple-600">{totalBrands}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-xs border border-gray-200 border-l-4 border-l-teal-600">
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block mb-0.5">Kategori</span>
          <p className="text-xl sm:text-2xl font-black text-teal-600">{totalCategories}</p>
        </div>
      </div>

      {/* 🚀 2. GELİŞMİŞ FİLTRELEME VE GLOBAL ARAMA BAR */}
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-gray-200 space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
          
          {/* Global Arama Kutu */}
          <div className="flex-1 relative">
            <span className="absolute left-3.5 top-3 text-gray-400 text-sm">🔍</span>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Ürün Adı, SKU veya Slug arayın..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs sm:text-sm min-h-[44px]"
            />
          </div>

          {/* Kategori Filtresi */}
          <select
            value={categoryFilter}
            onChange={(e) => updateFilters({ category: e.target.value, page: 1 })}
            className="px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white text-xs sm:text-sm min-h-[44px] font-medium"
          >
            <option value="">Tüm Kategoriler</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {/* Marka Filtresi */}
          <select
            value={brandFilter}
            onChange={(e) => updateFilters({ brand: e.target.value, page: 1 })}
            className="px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white text-xs sm:text-sm min-h-[44px] font-medium"
          >
            <option value="">Tüm Markalar</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>

          {/* Durum Filtresi */}
          <select
            value={statusFilter}
            onChange={(e) => updateFilters({ status: e.target.value, page: 1 })}
            className="px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white text-xs sm:text-sm min-h-[44px] font-medium"
          >
            <option value="">Tüm Durumlar</option>
            <option value="active">🟢 Aktif Ürünler</option>
            <option value="passive">🔴 Pasif Ürünler</option>
          </select>

          {/* Stok Durumu Filtresi */}
          <select
            value={stockFilter}
            onChange={(e) => updateFilters({ stockStatus: e.target.value, page: 1 })}
            className="px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white text-xs sm:text-sm min-h-[44px] font-medium"
          >
            <option value="">Tüm Stok Seviyeleri</option>
            <option value="in_stock">✅ Stokta Var (&gt;5)</option>
            <option value="critical">⚠️ Kritik Stok (1-5)</option>
            <option value="out_of_stock">🚫 Stok Tükendi (0)</option>
          </select>

          <button
            type="submit"
            className="bg-gray-900 hover:bg-gray-800 text-white font-extrabold px-5 py-2.5 rounded-xl transition text-xs sm:text-sm min-h-[44px]"
          >
            Filtrele
          </button>

          {(searchQuery || categoryFilter || brandFilter || statusFilter || stockFilter) && (
            <button
              type="button"
              onClick={() => {
                setSearchInput("");
                startTransition(() => router.push("/admin/products"));
              }}
              className="text-red-600 hover:bg-red-50 border border-red-200 font-extrabold px-3.5 py-2.5 rounded-xl transition text-xs sm:text-sm min-h-[44px]"
            >
              Temizle
            </button>
          )}
        </form>
      </div>

      {/* 🚀 3. MODERN DATA TABLE (DESKTOP) VE KART DÜZENİ (MOBİL) */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-200 overflow-hidden">
        
        {/* ÜST TOPLU SEÇİM VE GÖSTERİM BARI */}
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedIds.length === products.length && products.length > 0}
              onChange={handleSelectAll}
              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            Tümünü Seç ({products.length} Ürün)
          </label>

          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>Sayfa Başı Gösterim:</span>
            <select
              value={pageSize}
              onChange={(e) => updateFilters({ limit: Number(e.target.value), page: 1 })}
              className="bg-white border border-gray-200 px-2 py-1 rounded-lg text-xs font-bold outline-none"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {/* 💻 MASAÜSTÜ VERİ TABLOSU (hidden md:block) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-gray-50 text-gray-500 font-extrabold uppercase tracking-wider text-[10px] border-b border-gray-200">
              <tr>
                <th className="p-3.5 w-10 text-center">#</th>
                <th className="p-3.5 w-16">Görsel</th>
                <th className="p-3.5">Ürün Adı & SKU</th>
                <th className="p-3.5">Kategori / Marka</th>
                <th className="p-3.5">Fiyat</th>
                <th className="p-3.5">Stok Düzenle</th>
                <th className="p-3.5">Durum</th>
                <th className="p-3.5 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {paginatedProducts.map((product) => {
                const isSelected = selectedIds.includes(product.id);

                return (
                  <tr
                    key={product.id}
                    className={`transition ${isSelected ? "bg-blue-50/40" : "hover:bg-gray-50/70"}`}
                  >
                    <td className="p-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectOne(product.id)}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                    </td>

                    <td className="p-3.5">
                      <div className="w-12 h-12 bg-gray-50 rounded-xl overflow-hidden flex items-center justify-center border border-gray-200 flex-shrink-0">
                        {product.imageUrl ? (
                          <Image src={product.imageUrl} alt={product.name} className="w-full h-full object-contain" width={60} height={60} />
                        ) : (
                          <span className="text-[10px] text-gray-400">Yok</span>
                        )}
                      </div>
                    </td>

                    <td className="p-3.5">
                      <p className="font-extrabold text-gray-900 truncate max-w-xs">{product.name}</p>
                      <p className="text-[11px] text-gray-500 font-mono mt-0.5">
                        {product.sku ? `SKU: ${product.sku}` : "SKU Belirtilmedi"}
                      </p>
                    </td>

                    <td className="p-3.5">
                      <div className="flex flex-col gap-1">
                        <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[11px] font-bold w-fit">
                          {product.category?.name || "Kategorisiz"}
                        </span>
                        <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded text-[11px] font-bold w-fit">
                          {product.brand?.name || "Markasız"}
                        </span>
                      </div>
                    </td>

                    <td className="p-3.5">
                      <QuickPriceUpdate
                        productId={product.id}
                        currentPrice={product.price}
                        currentComparePrice={product.comparePrice}
                        onUpdate={() => router.refresh()}
                      />
                    </td>

                    <td className="p-3.5">
                      <QuickStockUpdate
                        productId={product.id}
                        currentStock={product.stock}
                        onUpdate={() => router.refresh()}
                      />
                    </td>

                    <td className="p-3.5">
                      <button
                        onClick={() => handleToggleActive(product.id)}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                          product.isActive
                            ? "bg-green-100 text-green-800 border border-green-200 hover:bg-green-200"
                            : "bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200"
                        }`}
                      >
                        <span>{product.isActive ? "🟢" : "🔴"}</span>
                        <span>{product.isActive ? "Aktif" : "Pasif"}</span>
                      </button>
                    </td>

                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/products/${product.id}`}
                          target="_blank"
                          className="p-1.5 text-gray-400 hover:text-blue-600 transition min-h-[36px] min-w-[36px] flex items-center justify-center font-bold text-xs"
                          title="Vitrinde Gör"
                        >
                          👁️
                        </Link>
                        <Link
                          href={`/admin/products/${product.id}/edit`}
                          className="p-1.5 text-gray-400 hover:text-green-600 transition min-h-[36px] min-w-[36px] flex items-center justify-center font-bold text-xs"
                          title="Düzenle"
                        >
                          ✏️
                        </Link>
                        <button
                          onClick={() => handleDuplicateProduct(product.id)}
                          className="p-1.5 text-gray-400 hover:text-purple-600 transition min-h-[36px] min-w-[36px] flex items-center justify-center font-bold text-xs"
                          title="Ürünü Kopyala (Duplicate)"
                        >
                          📄
                        </button>
                        <DeleteButton id={product.id} />
                      </div>
                    </td>
                  </tr>
                );
              })}

              {paginatedProducts.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-gray-400 font-medium">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <span className="text-4xl">🔍</span>
                      <p className="text-base font-extrabold text-gray-700">Ürün Bulunamadı</p>
                      <p className="text-xs text-gray-500">Seçtiğiniz filtreye veya arama kelimesine uygun ürün yok.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 📱 MOBİL KART GÖRÜNÜMÜ (md:hidden) */}
        <div className="md:hidden divide-y divide-gray-100">
          {paginatedProducts.map((product) => {
            const isSelected = selectedIds.includes(product.id);

            return (
              <div key={product.id} className={`p-4 space-y-3 ${isSelected ? "bg-blue-50/40" : ""}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectOne(product.id)}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <div className="w-12 h-12 bg-gray-50 rounded-xl overflow-hidden border border-gray-200 flex-shrink-0 flex items-center justify-center">
                      {product.imageUrl ? (
                        <Image src={product.imageUrl} alt={product.name} width={50} height={50} className="object-contain" />
                      ) : (
                        <span>📦</span>
                      )}
                    </div>
                    <div>
                      <p className="font-extrabold text-gray-900 text-xs sm:text-sm">{product.name}</p>
                      <p className="text-[11px] text-gray-500 font-mono">SKU: {product.sku || "Yok"}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleActive(product.id)}
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      product.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {product.isActive ? "🟢 Aktif" : "🔴 Pasif"}
                  </button>
                </div>

                <div className="flex justify-between items-center bg-gray-50 p-2.5 rounded-xl text-xs">
                  <div>
                    <span className="text-[10px] text-gray-400 block font-bold">FİYAT</span>
                    <span className="font-extrabold text-gray-900">{product.price.toLocaleString("tr-TR")} ₺</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block font-bold">STOK</span>
                    <QuickStockUpdate
                      productId={product.id}
                      currentStock={product.stock}
                      onUpdate={() => router.refresh()}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <div className="flex gap-1">
                    <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold">
                      {product.category?.name || "Kategorisiz"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Link href={`/admin/products/${product.id}/edit`} className="p-1.5 bg-gray-100 rounded-lg text-xs font-bold">
                      ✏️ Düzenle
                    </Link>
                    <button onClick={() => handleDuplicateProduct(product.id)} className="p-1.5 bg-purple-50 text-purple-700 rounded-lg text-xs font-bold">
                      📄 Çoğalt
                    </button>
                    <DeleteButton id={product.id} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 🚀 PAGINATION SAYFALAMA BARI */}
        {totalPages > 1 && (
          <div className="p-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-gray-500 font-medium">
              Sayfa <span className="font-bold text-gray-900">{currentPage}</span> / {totalPages}
            </span>

            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => updateFilters({ page: currentPage - 1 })}
                className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg font-bold text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-white"
              >
                &larr; Önceki
              </button>

              {Array.from({ length: totalPages }).map((_, idx) => {
                const pageNum = idx + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => updateFilters({ page: pageNum })}
                    className={`w-8 h-8 rounded-lg font-bold transition ${
                      currentPage === pageNum
                        ? "bg-gray-900 text-white"
                        : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                disabled={currentPage === totalPages}
                onClick={() => updateFilters({ page: currentPage + 1 })}
                className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg font-bold text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-white"
              >
                Sonraki &rarr;
              </button>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
