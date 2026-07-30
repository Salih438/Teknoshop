"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

export interface AnalyticsDataDTO {
  kpis: {
    totalRevenue: number;
    totalOrdersCount: number;
    newCustomers30d: number;
    averageOrderValue: number;
    completedPaymentsCount: number;
    cancellationRate: number;
    returnRate: number;
    avgCartItems: number;
    monthlyComparison: {
      currentMonthRevenue: number;
      lastMonthRevenue: number;
      percentageChange: number;
      isPositive: boolean;
    };
  };
  revenueChart: { label: string; revenue: number; orders: number }[];
  categorySales: { categoryName: string; totalRevenue: number; percentage: number }[];
  brandSales: { brandName: string; totalRevenue: number }[];
  topProducts: {
    id: string;
    name: string;
    imageUrl?: string | null;
    stock: number;
    totalQuantitySold: number;
    totalRevenue: number;
  }[];
  customerGrowth: { label: string; count: number }[];
  paymentTypes: { type: string; count: number; percentage: number }[];
  orderStatuses: { status: string; label: string; count: number; percentage: number }[];
  topCities: { city: string; ordersCount: number; totalRevenue: number }[];
  lowStockProducts: { id: string; name: string; stock: number; salesVelocity: number; estDaysLeft: number }[];
}

export default function AnalyticsCharts({ data }: { data: AnalyticsDataDTO }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activePeriod = (searchParams.get("period") || "30d").toLowerCase();

  const handlePeriodChange = (val: string) => {
    router.push(`/admin/analytics?period=${val}`);
  };

  const chartData = data.revenueChart || [];
  const maxRev = Math.max(...chartData.map((p) => p.revenue), 1);

  const exportCSV = () => {
    const bom = "\uFEFF"; // Fixes Excel Turkish Encoding
    let csvContent = bom;

    // SECTION 1: HEADER & SUMMARY
    csvContent += `E-TİCARET İŞLETME ANALİZİ VE GELİR RAPORU\n`;
    csvContent += `Rapor Tarihi;${new Date().toLocaleDateString("tr-TR")}\n\n`;

    csvContent += `GENEL METRİKLER ÖZETİ\n`;
    csvContent += `Toplam Ciro (TL);Sipariş Sayısı;Ort. Sipariş Tutarı (AOV);Yeni Müşteriler;Başarılı Ödeme;İptal Oranı;İade Oranı;Ort. Sepet Parça\n`;
    csvContent += `${data.kpis.totalRevenue};${data.kpis.totalOrdersCount};${data.kpis.averageOrderValue};${data.kpis.newCustomers30d};${data.kpis.completedPaymentsCount};%${data.kpis.cancellationRate};%${data.kpis.returnRate};${data.kpis.avgCartItems}\n\n`;

    // SECTION 2: CATEGORY BREAKDOWN
    csvContent += `KATEGORİ BAZLI GELİR DAĞILIMI\n`;
    csvContent += `Kategori Adı;Toplam Gelir (TL);Oran (%)\n`;
    data.categorySales.forEach((cat) => {
      csvContent += `${cat.categoryName};${cat.totalRevenue};%${cat.percentage}\n`;
    });
    csvContent += `\n`;

    // SECTION 3: BRAND BREAKDOWN
    csvContent += `MARKA BAZLI GELİR DAĞILIMI\n`;
    csvContent += `Marka Adı;Toplam Gelir (TL)\n`;
    data.brandSales.forEach((br) => {
      csvContent += `${br.brandName};${br.totalRevenue}\n`;
    });
    csvContent += `\n`;

    // SECTION 4: TOP PRODUCTS
    csvContent += `EN ÇOK SATAN ÜRÜNLER (TOP 10)\n`;
    csvContent += `Ürün Adı;Satış Adedi;Üretilen Ciro (TL);Stok Seviyesi\n`;
    data.topProducts.forEach((prod) => {
      csvContent += `${prod.name};${prod.totalQuantitySold};${prod.totalRevenue};${prod.stock}\n`;
    });
    csvContent += `\n`;

    // SECTION 5: TOP CITIES
    csvContent += `EN ÇOK SİPARİŞ VEREN İLLER\n`;
    csvContent += `Şehir;Sipariş Sayısı;Toplam Ciro (TL)\n`;
    data.topCities.forEach((city) => {
      csvContent += `${city.city};${city.ordersCount};${city.totalRevenue}\n`;
    });

    // DOWNLOAD TRIGGER WITH BLOB
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `analiz-raporu-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const { kpis } = data;

  return (
    <div className="space-y-8 w-full animate-in fade-in duration-300">
      
      {/* 🚀 BAŞLIK & GLOBAL FİLTRE VE EXPORT BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <span>📈</span> İşletme Analiz & Gelir Merkezi
          </h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-0.5 font-medium">
            Shopify Analytics ve Stripe Dashboard standartlarında anlık satış, müşteri ve finansal performans analizi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Tarih Aralığı Filtresi (URL SearchParams Entegreli) */}
          <div className="bg-white border border-gray-200 p-1 rounded-xl shadow-xs flex items-center gap-1 text-xs font-bold">
            {[
              { id: "7d", label: "7 Gün" },
              { id: "30d", label: "30 Gün" },
              { id: "90d", label: "90 Gün" },
              { id: "year", label: "Bu Yıl" },
              { id: "all", label: "Tümü" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handlePeriodChange(tab.id)}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  activePeriod === tab.id
                    ? "bg-gray-900 text-white shadow-xs"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={exportCSV}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-3.5 py-2.5 rounded-xl text-xs sm:text-sm transition shadow-xs flex items-center gap-1.5 min-h-[44px] cursor-pointer"
          >
            <span>📥</span> Rapor İndir (CSV)
          </button>
          <button
            onClick={() => window.print()}
            className="bg-gray-900 hover:bg-gray-800 text-white font-extrabold px-3.5 py-2.5 rounded-xl text-xs sm:text-sm transition shadow-xs flex items-center gap-1.5 min-h-[44px] cursor-pointer"
          >
            <span>🖨️</span> Yazdır (PDF)
          </button>
        </div>
      </div>

      {/* 🚀 1. DASHBOARD 8 CANLI KPI KARTI */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
        
        <div className="bg-white p-4 rounded-2xl shadow-xs border border-gray-200 border-l-4 border-l-emerald-600">
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block mb-0.5">Toplam Ciro</span>
          <p className="text-lg sm:text-xl font-black text-emerald-600">{kpis.totalRevenue.toLocaleString("tr-TR")} ₺</p>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-xs border border-gray-200 border-l-4 border-l-blue-600">
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block mb-0.5">Sipariş Sayısı</span>
          <p className="text-lg sm:text-xl font-black text-blue-600">{kpis.totalOrdersCount} Adet</p>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-xs border border-gray-200 border-l-4 border-l-indigo-600">
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block mb-0.5">Ort. Sipariş (AOV)</span>
          <p className="text-lg sm:text-xl font-black text-indigo-600">{kpis.averageOrderValue.toLocaleString("tr-TR")} ₺</p>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-xs border border-gray-200 border-l-4 border-l-purple-600">
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block mb-0.5">Yeni Müşteriler</span>
          <p className="text-lg sm:text-xl font-black text-purple-600">{kpis.newCustomers30d} Kişi</p>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-xs border border-gray-200 border-l-4 border-l-teal-600">
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block mb-0.5">Başarılı Ödeme</span>
          <p className="text-lg sm:text-xl font-black text-teal-600">{kpis.completedPaymentsCount} Adet</p>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-xs border border-gray-200 border-l-4 border-l-red-600">
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block mb-0.5">İptal Oranı</span>
          <p className="text-lg sm:text-xl font-black text-red-600">%{kpis.cancellationRate}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-xs border border-gray-200 border-l-4 border-l-amber-500">
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block mb-0.5">İade Oranı</span>
          <p className="text-lg sm:text-xl font-black text-amber-600">%{kpis.returnRate}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-xs border border-gray-200 border-l-4 border-l-gray-700">
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block mb-0.5">Ort. Sepet Parça</span>
          <p className="text-lg sm:text-xl font-black text-gray-800">{kpis.avgCartItems} Ürün</p>
        </div>

      </div>

      {/* 🚀 2. REVENUE COMPARISON (AYLIK AYLIK GELİR KARŞILAŞTIRMASI KARTI) */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-6 rounded-3xl shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <span className="bg-blue-600/30 text-blue-300 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-blue-500/30">
            Aylık Karşılaştırmalı Büyüme
          </span>
          <h3 className="text-xl sm:text-2xl font-black">Bu Ay Geliri: {kpis.monthlyComparison.currentMonthRevenue.toLocaleString("tr-TR")} ₺</h3>
          <p className="text-gray-400 text-xs font-medium">
            Geçen ay toplamı: {kpis.monthlyComparison.lastMonthRevenue.toLocaleString("tr-TR")} ₺
          </p>
        </div>

        <div className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl border border-white/10 backdrop-blur-xs">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl font-bold ${
            kpis.monthlyComparison.isPositive ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
          }`}>
            {kpis.monthlyComparison.isPositive ? "▲" : "▼"}
          </div>
          <div>
            <p className={`text-2xl font-black ${kpis.monthlyComparison.isPositive ? "text-emerald-400" : "text-red-400"}`}>
              {kpis.monthlyComparison.isPositive ? "+" : ""}%{kpis.monthlyComparison.percentageChange}
            </p>
            <span className="text-gray-300 text-xs font-medium">Geçen aya göre değişim</span>
          </div>
        </div>
      </div>

      {/* 🚀 3. GELİR VE SİPARİŞ TRENDİ (REVENUE & ORDERS CHART) */}
      <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-4">
        <div className="flex justify-between items-center border-b border-gray-100 pb-4">
          <div>
            <h3 className="font-black text-gray-900 text-base sm:text-lg flex items-center gap-2">
              <span>📊</span> Satış ve Sipariş Trend Analizi ({chartData.length} Günlük Görünüm)
            </h3>
            <p className="text-gray-500 text-xs font-medium mt-0.5">Seçilen zaman diliminde gerçekleşen günlük ciro ve sipariş hareketleri.</p>
          </div>
        </div>

        {/* CSS/SVG TABANLI DUYARLI VE YÜKSEK KONTRASTLI GRAFİK */}
        <div className="h-56 sm:h-64 w-full flex items-end gap-2 sm:gap-3 pt-12 pb-4 border-b border-gray-100 px-2 overflow-x-auto custom-scrollbar">
          {chartData.map((point, idx) => {
            const hasRevenue = point.revenue > 0;
            const heightPercent = hasRevenue
              ? Math.max(15, Math.round((point.revenue / maxRev) * 100))
              : 0;

            return (
              <div key={idx} className="flex-1 h-full flex flex-col items-center justify-end gap-2 min-w-[38px] group relative">
                {/* TOOLTIP ON HOVER (CİRO + SİPARİŞ SAYISI) */}
                <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-black px-2.5 py-1 rounded-xl opacity-0 group-hover:opacity-100 transition duration-150 whitespace-nowrap pointer-events-none shadow-xl z-20 font-mono border border-gray-700">
                  ₺{point.revenue.toLocaleString("tr-TR")} • {point.orders} Sipariş
                </div>

                <div className="w-full flex-1 flex items-end justify-center">
                  {hasRevenue ? (
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className="w-full bg-blue-600 group-hover:bg-blue-500 rounded-t-lg transition-all duration-300 shadow-sm border-t border-blue-400"
                    />
                  ) : (
                    <div className="w-full h-1.5 bg-gray-200 group-hover:bg-gray-300 rounded-full transition-all" />
                  )}
                </div>

                <span className="text-[10px] font-bold text-gray-400 truncate max-w-[40px]">
                  {point.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 🚀 4. KATEGORİ VE MARKA PERFORMANSI (DONUT & BAR CHARTS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Kategori Bazlı Satış Dağılımı */}
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-4">
          <h3 className="font-black text-gray-900 text-base flex items-center gap-2 border-b border-gray-100 pb-3">
            <span>🏷️</span> Kategori Bazlı Satış Dağılımı
          </h3>
          <div className="space-y-3">
            {data.categorySales.map((cat, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-gray-800">
                  <span>{cat.categoryName}</span>
                  <span>{cat.totalRevenue.toLocaleString("tr-TR")} ₺ (%{cat.percentage})</span>
                </div>
                <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${cat.percentage}%` }}
                    className="bg-blue-600 h-full rounded-full transition-all duration-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Marka Bazlı Satış Dağılımı */}
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-4">
          <h3 className="font-black text-gray-900 text-base flex items-center gap-2 border-b border-gray-100 pb-3">
            <span>🏭</span> Marka Bazlı Ciro Dağılımı
          </h3>
          <div className="space-y-3">
            {data.brandSales.map((br, idx) => {
              const maxBrandRev = Math.max(...data.brandSales.map((b) => b.totalRevenue), 1);
              const widthPct = Math.round((br.totalRevenue / maxBrandRev) * 100);

              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-gray-800">
                    <span>{br.brandName}</span>
                    <span>{br.totalRevenue.toLocaleString("tr-TR")} ₺</span>
                  </div>
                  <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${widthPct}%` }}
                      className="bg-purple-600 h-full rounded-full transition-all duration-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* 🚀 5. EN ÇOK SATAN İLK 10 ÜRÜN TABLOSU */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-5 bg-gray-50/80 border-b border-gray-200 flex justify-between items-center">
          <h3 className="font-black text-gray-900 text-base flex items-center gap-2">
            <span>🔥</span> En Çok Satan Ürünler (Top 10)
          </h3>
          <span className="text-xs font-bold text-gray-500">Satış Adedine Göre Sıralı</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-gray-50 text-gray-500 font-extrabold uppercase tracking-wider text-[10px] border-b border-gray-200">
              <tr>
                <th className="p-3.5 w-12 text-center">Sıra</th>
                <th className="p-3.5 w-16">Görsel</th>
                <th className="p-3.5">Ürün Adı</th>
                <th className="p-3.5">Satış Adedi</th>
                <th className="p-3.5">Üretilen Ciro</th>
                <th className="p-3.5">Stok Seviyesi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {data.topProducts.map((prod, idx) => (
                <tr key={prod.id} className="hover:bg-gray-50/70 transition">
                  <td className="p-3.5 font-black text-gray-900 text-center">{idx + 1}</td>
                  <td className="p-3.5">
                    <div className="w-10 h-10 bg-gray-50 rounded-xl overflow-hidden border border-gray-200 flex items-center justify-center">
                      {prod.imageUrl ? (
                        <Image src={prod.imageUrl} alt={prod.name} width={40} height={40} className="object-contain" />
                      ) : (
                        <span>📦</span>
                      )}
                    </div>
                  </td>
                  <td className="p-3.5 font-extrabold text-gray-900">{prod.name}</td>
                  <td className="p-3.5 font-bold text-blue-600">{prod.totalQuantitySold} Adet Satıldı</td>
                  <td className="p-3.5 font-black text-emerald-600">{prod.totalRevenue.toLocaleString("tr-TR")} ₺</td>
                  <td className="p-3.5 font-bold">
                    <span className={`px-2.5 py-1 rounded-full text-xs ${
                      prod.stock > 10 ? "bg-green-100 text-green-800" : prod.stock > 0 ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"
                    }`}>
                      {prod.stock} Adet Kaldı
                    </span>
                  </td>
                </tr>
              ))}
              {data.topProducts.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400">Henüz satış verisi kaydedilmemiş.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 🚀 6. ÖDEME YÖNTEMLERİ VE İLLER DOKUMU */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Ödeme Yöntemleri Dağılımı */}
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-4">
          <h3 className="font-black text-gray-900 text-base flex items-center gap-2 border-b border-gray-100 pb-3">
            <span>💳</span> Ödeme Yöntemleri Dağılımı
          </h3>
          <div className="space-y-3">
            {data.paymentTypes.map((pt, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-2xl border border-gray-200">
                <span className="font-bold text-gray-900 text-xs">{pt.type}</span>
                <div className="text-right">
                  <span className="font-black text-blue-600 text-xs">{pt.count} Sipariş</span>
                  <span className="text-[10px] text-gray-400 block font-bold">%{pt.percentage} Oran</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Şehir Bazlı Sipariş Yoğunluğu */}
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-4">
          <h3 className="font-black text-gray-900 text-base flex items-center gap-2 border-b border-gray-100 pb-3">
            <span>📍</span> En Çok Sipariş Veren İller (Top 10)
          </h3>
          <div className="space-y-2">
            {data.topCities.map((city, idx) => (
              <div key={idx} className="flex justify-between items-center p-2.5 border-b border-gray-100 text-xs">
                <span className="font-bold text-gray-900">{idx + 1}. {city.city}</span>
                <span className="font-extrabold text-gray-700">{city.ordersCount} Sipariş ({city.totalRevenue.toLocaleString("tr-TR")} ₺)</span>
              </div>
            ))}
            {data.topCities.length === 0 && (
              <p className="text-xs text-gray-400">Şehir verisi henüz kaydedilmemiş.</p>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
