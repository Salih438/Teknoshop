// app/admin/layout.tsx
import Link from "next/link";
import { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-100">
      
      {/* SOL MENÜ (SIDEBAR) */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-6 text-center border-b border-gray-800">
          <h2 className="text-2xl font-bold tracking-wider">YÖNETİM</h2>
          <p className="text-gray-400 text-sm mt-1">v1.0.0</p>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          <Link href="/admin" className="block px-4 py-3 rounded-lg hover:bg-gray-800 transition">
            📊 Dashboard
          </Link>
          <Link href="/admin/products" className="block px-4 py-3 rounded-lg hover:bg-gray-800 transition">
            📦 Ürünler
          </Link>
          <Link href="/admin/categories" className="block px-4 py-3 rounded-lg hover:bg-gray-800 transition">
            🏷️ Kategoriler
          </Link>
          <Link href="/admin/brands" className="block px-4 py-3 rounded-lg hover:bg-gray-800 transition">
            🏭 Markalar
          </Link>
          <Link href="/admin/orders" className="block px-4 py-3 rounded-lg hover:bg-gray-800 transition">
            📋 Siparişler
          </Link>
          <Link href="/admin/users" className="block px-4 py-3 rounded-lg hover:bg-gray-800 transition">
            👥 Kullanıcılar
          </Link>
        </nav>

        <div className="p-4 border-t border-gray-800">
          <Link href="/" className="block text-center px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700 transition">
            Çıkış Yap
          </Link>
        </div>
      </aside>

      {/* SAĞ İÇERİK ALANI (Değişen Sayfalar) */}
      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>

    </div>
  );
}