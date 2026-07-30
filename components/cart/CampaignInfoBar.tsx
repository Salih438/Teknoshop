"use client";

export default function CampaignInfoBar() {
  return (
    <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/80 to-blue-50/90 p-4 sm:p-5 rounded-3xl border border-blue-200/80 shadow-2xs space-y-2.5 text-left">
      <div className="flex items-center gap-2">
        <span className="text-base">🎁</span>
        <h4 className="font-extrabold text-blue-950 text-xs sm:text-sm">
          Siparişiniz İçin Geçerli Kampanyalar & Bilgilendirme
        </h4>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs text-gray-700 font-medium">
        <div className="flex items-center gap-2 bg-white/80 p-2.5 rounded-2xl border border-blue-100/80">
          <span className="text-green-600 font-bold text-sm">✓</span>
          <span><strong>5.000 ₺ üzeri</strong> tüm siparişlerinizde Kargo Ücretsizdir.</span>
        </div>

        <div className="flex items-center gap-2 bg-white/80 p-2.5 rounded-2xl border border-blue-100/80">
          <span className="text-blue-600 font-bold text-sm">✓</span>
          <span>İndirim kuponlarınızı <strong>ödeme ekranında</strong> uygulayabilirsiniz.</span>
        </div>
      </div>
    </div>
  );
}
