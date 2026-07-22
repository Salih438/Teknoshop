// app/admin/users/page.tsx
import { requireAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import UserActionButtons from "./UserActionButtons";
import { Prisma, Role } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ [key: string]: string | string[] | undefined }> 
}) {
  try {
    await requireAdmin();
  } catch {
    redirect("/");
  }

  // 2. ARAMA VE FİLTRE PARAMETRELERİNİ YAKALAMA
  const resolvedParams = await searchParams;
  const query = typeof resolvedParams?.q === "string" ? resolvedParams.q : "";
  const roleFilter = typeof resolvedParams?.role === "string" ? resolvedParams.role : "";

  // Dinamik Filtreleme Mantığı
  const whereCondition: Prisma.UserWhereInput = {};
  if (query) {
    whereCondition.OR = [
      { name: { contains: query, mode: "insensitive" } },
      { email: { contains: query, mode: "insensitive" } },
    ];
  }
  if (roleFilter) {
    whereCondition.role = roleFilter as Role;
  }

  // 3. VERİTABANI SORGULARI (Paralel Çalıştırma ile Yüksek Hız) 
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Bugünün başlangıç saatini alıyoruz

  const [users, totalUsers, adminCount, userCount, todayUsers] = await Promise.all([
    // Filtrelenmiş Kullanıcı listesi
    prisma.user.findMany({
      where: whereCondition,
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { orders: true } },
        orders: { select: { totalPrice: true } }, 
      },
    }),
    // İstatistik Kartları için Sayımlar
    prisma.user.count(),
    prisma.user.count({ where: { role: "ADMIN" } }),
    prisma.user.count({ where: { role: "USER" } }),
    prisma.user.count({ where: { createdAt: { gte: today } } }),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Kullanıcı Yönetimi</h1>
      </div>

      {/* İSTATİSTİK KARTLARI */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-blue-50 border border-blue-100 p-6 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-blue-600 font-bold text-sm uppercase tracking-wider mb-1">Toplam Kullanıcı</p>
            <p className="text-3xl font-extrabold text-blue-900">{totalUsers}</p>
          </div>
          <div className="text-4xl">👥</div>
        </div>
        
        <div className="bg-green-50 border border-green-100 p-6 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-green-600 font-bold text-sm uppercase tracking-wider mb-1">Admin</p>
            <p className="text-3xl font-extrabold text-green-900">{adminCount}</p>
          </div>
          <div className="text-4xl">🛡️</div>
        </div>

        <div className="bg-yellow-50 border border-yellow-100 p-6 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-yellow-600 font-bold text-sm uppercase tracking-wider mb-1">Normal Kullanıcı</p>
            <p className="text-3xl font-extrabold text-yellow-900">{userCount}</p>
          </div>
          <div className="text-4xl">👤</div>
        </div>

        <div className="bg-purple-50 border border-purple-100 p-6 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-purple-600 font-bold text-sm uppercase tracking-wider mb-1">Bugün Kayıt Olan</p>
            <p className="text-3xl font-extrabold text-purple-900">{todayUsers}</p>
          </div>
          <div className="text-4xl">✨</div>
        </div>
      </div>

      {/* ARAMA VE FİLTRELEME ÇUBUĞU */}
      <form action="/admin/users" method="GET" className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 w-full relative">
          <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="İsim veya E-posta ara..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <select name="role" defaultValue={roleFilter} className="w-full md:w-auto px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
          <option value="">Tüm Roller</option>
          <option value="ADMIN">Admin</option>
          <option value="USER">User</option>
        </select>

        <button type="submit" className="w-full md:w-auto bg-gray-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-800 transition">
          Filtrele
        </button>
        {(query || roleFilter) && (
          <Link href="/admin/users" className="text-gray-500 hover:text-red-500 font-medium px-2 transition">
            Temizle
          </Link>
        )}
      </form>

      {/* KULLANICI LİSTELEME TABLOSU */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-500 uppercase tracking-wider">
                <th className="p-4 font-medium w-16">Profil</th>
                <th className="p-4 font-medium">Kullanıcı Bilgisi</th>
                <th className="p-4 font-medium">Rol</th>
                <th className="p-4 font-medium">Sipariş</th>
                <th className="p-4 font-medium">Harcama</th>
                <th className="p-4 font-medium">Kayıt Tarihi</th>
                <th className="p-4 font-medium text-center">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user) => {
                const totalSpent = user.orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
                const initial = user.name ? user.name.charAt(0).toUpperCase() : "U";

                return (
                  <tr key={user.id} className={`hover:bg-gray-50 transition group ${!user.isActive ? 'opacity-60 bg-gray-50' : ''}`}>
                    <td className="p-4">
                      <div className="w-10 h-10 bg-blue-100 text-blue-700 font-bold rounded-full flex items-center justify-center">
                        {initial}
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-gray-900">
                        {user.name || "İsimsiz"}
                        {!user.isActive && <span className="ml-2 text-xs text-red-500 font-bold">(Pasif)</span>}
                      </p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${user.role === 'ADMIN' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4 font-medium text-gray-700">
                      {user._count.orders} Sipariş
                    </td>
                    <td className="p-4 font-bold text-blue-600">
                      {totalSpent.toLocaleString("tr-TR")} ₺
                    </td>
                    <td className="p-4 text-gray-500 text-sm">
                      {new Date(user.createdAt).toLocaleDateString("tr-TR")}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-3">
                        <Link href={`/admin/users/${user.id}`} className="text-gray-400 hover:text-blue-600 transition" title="Görüntüle">
                          👁️
                        </Link>
                        <UserActionButtons 
                          userId={user.id} 
                          currentRole={user.role} 
                          isActive={user.isActive} 
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}

              {users.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-gray-500">
                    <p className="text-4xl mb-3">🔍</p>
                    <p className="font-medium text-lg text-gray-900">Kullanıcı bulunamadı</p>
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