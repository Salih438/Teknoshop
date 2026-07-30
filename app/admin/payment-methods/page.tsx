import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { AuditLogService } from "@/lib/services/audit-log.service";
import { AuditRiskLevel } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminPaymentMethodsPage() {
  // 1. GÜVENLİK: MANAGE_PAYMENT_METHODS iznine sahip kullanıcılar erişebilir
  try {
    await requireAdmin("MANAGE_PAYMENT_METHODS");
  } catch {
    redirect("/");
  }

  // 2. VERİ ÇEKME: Mevcut ödeme yöntemlerini getir
  const paymentMethods = await prisma.paymentMethod.findMany({
    orderBy: { createdAt: "desc" },
  });

  // 3. SERVER ACTION: Yeni Ödeme Yöntemi Ekleme
  async function addPaymentMethod(formData: FormData) {
    "use server";
    const adminUser = await requireAdmin("MANAGE_PAYMENT_METHODS");

    const name = (formData.get("name") as string)?.trim();
    const type = formData.get("type") as "CREDIT_CARD" | "BANK_TRANSFER" | "CASH_ON_DELIVERY";
    const description = (formData.get("description") as string)?.trim();
    const feeRaw = formData.get("fee") as string;
    const fee = parseFloat(feeRaw) || 0;

    if (!name) {
      throw new Error("Ödeme yöntemi ismi zorunludur.");
    }

    if (fee < 0) {
      throw new Error("Ek işlem ücreti negatif bir değer olamaz.");
    }

    // 🛡️ DUPLICATE GUARD: Aynı sistem türünde başka aktif/kayıtlı yöntem var mı?
    const existingType = await prisma.paymentMethod.findFirst({
      where: { type },
    });

    if (existingType) {
      throw new Error(`'${type}' sistem türünde zaten tanımlanmış bir ödeme yöntemi bulunmaktadır.`);
    }

    const created = await prisma.paymentMethod.create({
      data: { name, type, description, fee },
    });

    // 🛡️ AUDIT LOG
    try {
      await AuditLogService.createAuditLog({
        adminId: adminUser.id,
        adminName: adminUser.name,
        adminEmail: adminUser.email,
        action: "PAYMENT_METHOD_CREATE",
        entityType: "PaymentMethod",
        entityId: created.id,
        entityName: created.name,
        riskLevel: AuditRiskLevel.HIGH,
        newValue: { name: created.name, type: created.type, fee: created.fee },
      });
    } catch (auditErr) {
      console.error("Audit log hatası (Ödeme Yöntemi Ekle):", auditErr);
    }

    revalidatePath("/admin/payment-methods");
    revalidatePath("/checkout");
  }

  // 4. SERVER ACTION: Ödeme Yöntemini Aktif/Pasif Yapma
  async function toggleStatus(id: string, currentStatus: boolean) {
    "use server";
    const adminUser = await requireAdmin("MANAGE_PAYMENT_METHODS");

    const targetMethod = await prisma.paymentMethod.findUnique({
      where: { id },
      select: { name: true, type: true },
    });
    
    const updated = await prisma.paymentMethod.update({
      where: { id },
      data: { isActive: !currentStatus },
    });

    // 🛡️ AUDIT LOG (STATUS TOGGLE)
    try {
      await AuditLogService.createAuditLog({
        adminId: adminUser.id,
        adminName: adminUser.name,
        adminEmail: adminUser.email,
        action: "PAYMENT_METHOD_TOGGLE",
        entityType: "PaymentMethod",
        entityId: updated.id,
        entityName: targetMethod?.name || updated.name,
        riskLevel: AuditRiskLevel.MEDIUM,
        oldValue: { isActive: currentStatus },
        newValue: { isActive: !currentStatus },
      });
    } catch (auditErr) {
      console.error("Audit log hatası (Ödeme Yöntemi Durumu):", auditErr);
    }

    revalidatePath("/admin/payment-methods");
    revalidatePath("/checkout");
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Ödeme Yöntemleri</h1>
          <p className="text-gray-500 mt-1">Sitede geçerli olacak ödeme seçeneklerini buradan yönetebilirsiniz.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* YENİ EKLEME FORMU */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Yeni Yöntem Ekle</h2>
          <form action={addPaymentMethod} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Görünecek İsim</label>
              <input type="text" name="name" required placeholder="Örn: Havale / EFT" className="w-full border-gray-200 rounded-lg p-3 bg-gray-50 focus:bg-white transition-colors border outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Sistem Türü</label>
              <select name="type" required className="w-full border-gray-200 rounded-lg p-3 bg-gray-50 focus:bg-white transition-colors border outline-none focus:ring-2 focus:ring-blue-500">
                <option value="BANK_TRANSFER">Havale / EFT</option>
                <option value="CREDIT_CARD">Kredi Kartı (Sanal POS)</option>
                <option value="CASH_ON_DELIVERY">Kapıda Ödeme</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Açıklama (Opsiyonel)</label>
              <textarea name="description" rows={3} placeholder="Müşteriye gösterilecek IBAN veya notlar..." className="w-full border-gray-200 rounded-lg p-3 bg-gray-50 focus:bg-white transition-colors border outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Ek İşlem Ücreti (₺)</label>
              <input type="number" name="fee" step="0.01" defaultValue="0" min="0" className="w-full border-gray-200 rounded-lg p-3 bg-gray-50 focus:bg-white transition-colors border outline-none focus:ring-2 focus:ring-blue-500" />
              <p className="text-xs text-gray-400 mt-1">Örn: Kapıda ödeme hizmet bedeli için 29.90 yazabilirsiniz.</p>
            </div>

            <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
              Sisteme Ekle
            </button>
          </form>
        </div>

        {/* MEVCUT YÖNTEMLER LİSTESİ */}
        <div className="lg:col-span-2 space-y-4">
          {paymentMethods.length === 0 ? (
            <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center">
              <span className="text-gray-400 font-medium">Henüz hiçbir ödeme yöntemi eklenmemiş.</span>
            </div>
          ) : (
            paymentMethods.map((method) => (
              <div key={method.id} className={`p-6 rounded-2xl border transition-all ${method.isActive ? 'bg-white border-gray-200 shadow-sm' : 'bg-gray-50 border-gray-200 opacity-60'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">{method.name}</h3>
                      <span className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider rounded-md bg-gray-100 text-gray-600">
                        {method.type}
                      </span>
                    </div>
                    {method.description && (
                      <p className="text-gray-600 text-sm whitespace-pre-wrap mt-2">{method.description}</p>
                    )}
                    {method.fee > 0 && (
                      <p className="text-sm font-bold text-orange-600 mt-3 flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                        +{method.fee.toLocaleString('tr-TR')} ₺ Ek Ücret
                      </p>
                    )}
                  </div>
                  
                  {/* AKTİF / PASİF YAPMA BUTONU */}
                  <form action={toggleStatus.bind(null, method.id, method.isActive)}>
                    <button type="submit" className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${method.isActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                      {method.isActive ? 'Pasife Al' : 'Aktifleştir'}
                    </button>
                  </form>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}