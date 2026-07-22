import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// 🚀 İstemci (Client) tabanlı silme butonumuzu içeri aktarıyoruz
import DeleteCouponButton from "@/components/admin/DeleteCouponButton";

export const dynamic = "force-dynamic";

export default async function AdminCouponsPage() {
  // 1. GÜVENLİK
  try {
    await requireAdmin();
  } catch {
    redirect("/");
  }

  // 2. VERİ ÇEKME: Tüm kuponları getir
  const coupons = await prisma.coupon.findMany({
    orderBy: { expireDate: "desc" },
  });

  // 3. SERVER ACTION: Yeni Kupon Ekleme
  async function addCoupon(formData: FormData) {
    "use server";
    await requireAdmin();

    const rawCode = formData.get("code") as string;
    const code = rawCode.trim().toUpperCase();
    const discount = parseFloat(formData.get("discount") as string);
    const minAmountStr = formData.get("minAmount") as string;
    const minAmount = minAmountStr ? parseFloat(minAmountStr) : null;
    const isSingleUse = formData.get("isSingleUse") === "on";
    const usageLimitStr = formData.get("usageLimit") as string;
    const usageLimit = usageLimitStr ? parseInt(usageLimitStr, 10) : 100;
    const expireDateStr = formData.get("expireDate") as string;
    const expireDate = new Date(expireDateStr);

    await prisma.coupon.create({
      data: {
        code,
        discount,
        minAmount,
        isSingleUse,
        usageLimit,
        expireDate,
        isActive: true,
      },
    });

    revalidatePath("/admin/coupons");
    revalidatePath("/checkout");
  }

  // 4. SERVER ACTION: Kuponu Aktif/Pasif Yapma
  async function toggleStatus(id: string, currentStatus: boolean) {
    "use server";
    await requireAdmin();
    
    await prisma.coupon.update({
      where: { id },
      data: { isActive: !currentStatus },
    });

    revalidatePath("/admin/coupons");
    revalidatePath("/checkout");
  }


  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Kupon Yönetimi</h1>
          <p className="text-gray-500 mt-1">Sistemdeki indirim kuponlarını buradan yönetebilirsiniz.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* YENİ EKLEME FORMU */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Yeni Kupon Ekle</h2>
          <form action={addCoupon} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Kupon Kodu</label>
              <input type="text" name="code" required placeholder="Örn: YAZ100" className="w-full border-gray-200 rounded-lg p-3 bg-gray-50 focus:bg-white transition-colors border outline-none focus:ring-2 focus:ring-blue-500 uppercase" />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">İndirim Oranı (%)</label>
              <input type="number" name="discount" step="0.01" required min="0.01" max="100" placeholder="Örn: 10" className="w-full border-gray-200 rounded-lg p-3 bg-gray-50 focus:bg-white transition-colors border outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Minimum Sepet Tutarı (₺) (Opsiyonel)</label>
              <input type="number" name="minAmount" step="0.01" min="0" placeholder="Örn: 500" className="w-full border-gray-200 rounded-lg p-3 bg-gray-50 focus:bg-white transition-colors border outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Kullanım Limiti</label>
              <input type="number" name="usageLimit" defaultValue="100" min="1" required className="w-full border-gray-200 rounded-lg p-3 bg-gray-50 focus:bg-white transition-colors border outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Son Kullanma Tarihi</label>
              <input type="datetime-local" name="expireDate" required className="w-full border-gray-200 rounded-lg p-3 bg-gray-50 focus:bg-white transition-colors border outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input type="checkbox" id="isSingleUse" name="isSingleUse" className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
              <label htmlFor="isSingleUse" className="text-sm font-bold text-gray-700">Kişiye Özel (Herkes Sadece 1 Kez Kullanabilir)</label>
            </div>

            <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-sm mt-4">
              Kupon Oluştur
            </button>
          </form>
        </div>

        {/* MEVCUT KUPONLAR LİSTESİ */}
        <div className="lg:col-span-2 space-y-4">
          {coupons.length === 0 ? (
            <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center">
              <span className="text-gray-400 font-medium">Henüz hiçbir aktif kupon eklenmemiş.</span>
            </div>
          ) : (
            coupons.map((coupon) => {
              const isExpired = new Date(coupon.expireDate) < new Date();
              return (
                <div key={coupon.id} className={`p-6 rounded-2xl border transition-all ${coupon.isActive && !isExpired ? 'bg-white border-gray-200 shadow-sm' : 'bg-gray-50 border-gray-200 opacity-60'}`}>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-black text-gray-900 tracking-wider uppercase">{coupon.code}</h3>
                        {coupon.isSingleUse && (
                          <span className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider rounded-md bg-blue-100 text-blue-700">
                            TEK KULLANIM
                          </span>
                        )}
                        {isExpired && (
                          <span className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider rounded-md bg-red-100 text-red-700">
                            SÜRESİ DOLDU
                          </span>
                        )}
                      </div>
                      <div className="text-gray-600 text-sm space-y-1 mt-2">
                        <p><span className="font-semibold">İndirim:</span> %{coupon.discount}</p>
                        {coupon.minAmount !== null && (
                          <p><span className="font-semibold">Min. Sepet:</span> {coupon.minAmount.toLocaleString('tr-TR')} ₺</p>
                        )}
                        <p><span className="font-semibold">Kullanım:</span> {coupon.usedCount} / {coupon.usageLimit}</p>
                        <p><span className="font-semibold">Son Tarih:</span> {new Date(coupon.expireDate).toLocaleString('tr-TR')}</p>
                      </div>
                    </div>
                    
                    {/* BUTONLAR GRUBU: Pasife Al ve Sil */}
                    <div className="flex items-center gap-2 mt-4 sm:mt-0">
                      <form action={toggleStatus.bind(null, coupon.id, coupon.isActive)}>
                        <button type="submit" className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${coupon.isActive ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}>
                          {coupon.isActive ? 'Pasife Al' : 'Aktifleştir'}
                        </button>
                      </form>

                      {/* GÜNCELLENEN CLIENT COMPONENT'İMİZ */}
                      <DeleteCouponButton id={coupon.id} />
                    </div>

                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}