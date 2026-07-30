import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const orderId = resolvedParams.id;

    // 1. Kimlik Doğrulama
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return new NextResponse("Unauthorized - Giriş yapmalısınız", { status: 401 });
    }

    const email = clerkUser.emailAddresses?.[0]?.emailAddress;
    if (!email) {
      return new NextResponse("Unauthorized - E-posta bulunamadı", { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true, role: true },
    });

    if (!dbUser) {
      return new NextResponse("Kullanıcı bulunamadı", { status: 404 });
    }

    // 2. Sipariş Detaylarını Çek
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { name: true, email: true, phone: true } },
        address: true,
        items: {
          include: {
            product: { select: { name: true, sku: true } },
            variant: { select: { color: true, storage: true, combination: true, sku: true } },
          },
        },
        payment: { include: { paymentMethod: true } },
        shipment: true,
      },
    });

    if (!order) {
      return new NextResponse("Sipariş bulunamadı", { status: 404 });
    }

    // Güvenlik Kalkanı: Sipariş müşterinin kendisinin mi yoksa Admin mi?
    if (order.userId !== dbUser.id && dbUser.role !== "ADMIN") {
      return new NextResponse("Bu faturayı görüntüleme yetkiniz yok", { status: 403 });
    }

    // Mağaza Ayarları (Veritabanından Dinamik Çekim)
    const storeSettings = await prisma.storeSettings.findFirst();
    const storeName = process.env.NEXT_PUBLIC_STORE_NAME || "TEKNOSHOP TEKNOLOJİ A.Ş.";
    const storeAddress = storeSettings?.address || "Büyükdere Cad. No:123, Levent / İstanbul";
    const storePhone = storeSettings?.phone || "0850 123 45 67";
    const storeEmail = storeSettings?.email || "fatura@teknoshop.com";

    // Finansal Hesaplamalar
    const subTotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const discount = order.discountAmount || 0;
    const netAmount = Math.max(0, subTotal - discount);
    const kdvAmount = Number((netAmount * 0.20).toFixed(2));
    const orderCode = `#ORD-${order.id.slice(-8).toUpperCase()}`;
    const formattedDate = new Date(order.createdAt).toLocaleDateString("tr-TR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Printable Kurumsal HTML Fatura Şablonu
    const htmlContent = `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>Fatura - ${orderCode}</title>
  <style>
    * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    body { background-color: #f8fafc; color: #1e293b; padding: 2rem; margin: 0; }
    .invoice-card { max-width: 800px; margin: 0 auto; background: #ffffff; padding: 2.5rem; border-radius: 1rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #3b82f6; padding-bottom: 1.5rem; margin-bottom: 2rem; }
    .brand-title { font-size: 1.75rem; font-weight: 900; color: #1e3a8a; margin: 0; }
    .badge { background: #dbeafe; color: #1e40af; font-weight: 700; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.85rem; display: inline-block; margin-top: 0.5rem; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2rem; }
    .section-title { font-size: 0.75rem; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem; }
    .address-box { font-size: 0.9rem; line-height: 1.5; color: #334155; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 2rem; }
    th { background: #f1f5f9; text-align: left; padding: 0.75rem 1rem; font-size: 0.8rem; font-weight: 800; color: #475569; text-transform: uppercase; border-bottom: 1px solid #cbd5e1; }
    td { padding: 1rem; border-bottom: 1px solid #e2e8f0; font-size: 0.9rem; }
    .text-right { text-align: right; }
    .totals-table { width: 300px; margin-left: auto; }
    .totals-table td { padding: 0.5rem 1rem; }
    .grand-total { font-size: 1.2rem; font-weight: 900; color: #1e3a8a; background: #eff6ff; }
    .no-print { display: flex; gap: 1rem; justify-content: center; margin-bottom: 1.5rem; }
    .btn { background: #2563eb; color: white; border: none; padding: 0.75rem 1.5rem; font-weight: 700; border-radius: 0.5rem; cursor: pointer; text-decoration: none; font-size: 0.9rem; }
    .btn:hover { background: #1d4ed8; }
    @media print {
      body { background: white; padding: 0; }
      .invoice-card { box-shadow: none; border: none; padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>

  <div class="no-print">
    <button onclick="window.print()" class="btn">🖨️ Faturayı Yazdır / PDF İndir</button>
  </div>

  <div class="invoice-card">
    <!-- Üst Başlık -->
    <div class="header">
      <div>
        <h1 class="brand-title">${storeName}</h1>
        <p style="font-size:0.85rem; color:#64748b; margin:0.25rem 0 0 0;">${storeAddress} | Tel: ${storePhone}</p>
        <span class="badge">E-ARŞİV FATURA</span>
      </div>
      <div style="text-align: right;">
        <h2 style="font-size: 1.25rem; font-weight: 800; margin: 0; color: #0f172a;">${orderCode}</h2>
        <p style="font-size: 0.85rem; color: #64748b; margin: 0.25rem 0 0 0;">Tarih: <strong>${formattedDate}</strong></p>
      </div>
    </div>

    <!-- Adres Bilgileri -->
    <div class="grid-2">
      <div>
        <div class="section-title">Müşteri / Teslimat Adresi</div>
        <div class="address-box">
          <strong>${order.user?.name || "Değerli Müşterimiz"}</strong><br>
          ${order.address?.title ? `${order.address.title}<br>` : ""}
          ${order.address?.address || "Açık Adres"}<br>
          ${order.address?.district || ""} / ${order.address?.city || ""}<br>
          E-Posta: ${order.user?.email || "-"}
        </div>
      </div>
      <div>
        <div class="section-title">Ödeme & Kargo Detayları</div>
        <div class="address-box">
          <strong>Ödeme Yöntemi:</strong> ${order.payment?.paymentMethod?.name || "Kredi Kartı / Banka"}<br>
          <strong>Ödeme Durumu:</strong> ${order.payment?.status === "COMPLETED" ? "Ödendi" : "Bekliyor"}<br>
          <strong>Kargo Firması:</strong> ${order.shipment?.company || "Yurtiçi Kargo"}<br>
          <strong>Takip No:</strong> ${order.shipment?.trackingNumber || "Hazırlanıyor"}
        </div>
      </div>
    </div>

    <!-- Ürün Tablosu -->
    <table>
      <thead>
        <tr>
          <th>Ürün Açıklaması</th>
          <th class="text-right">Adet</th>
          <th class="text-right">Birim Fiyat</th>
          <th class="text-right">Toplam (KDV Dâhil)</th>
        </tr>
      </thead>
      <tbody>
        ${order.items.map((item) => {
          const variantDetails = item.variant
            ? [item.variant.color, item.variant.storage, item.variant.combination].filter(Boolean).join(" / ")
            : "";
          return `
            <tr>
              <td>
                <strong>${item.product?.name || "Ürün"}</strong>
                ${variantDetails ? `<br><span style="font-size:0.8rem; color:#64748b;">Varyant: ${variantDetails}</span>` : ""}
              </td>
              <td class="text-right">${item.quantity} Adet</td>
              <td class="text-right">${item.price.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺</td>
              <td class="text-right">${(item.price * item.quantity).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺</td>
            </tr>
          `;
        }).join("")}
      </tbody>
    </table>

    <!-- Alt Toplamlar -->
    <div style="display: flex; justify-content: flex-end;">
      <table class="totals-table">
        <tr>
          <td style="color:#64748b;">Ara Toplam:</td>
          <td class="text-right">${subTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺</td>
        </tr>
        ${discount > 0 ? `
        <tr>
          <td style="color:#16a34a; font-weight:700;">Kupon İndirimi:</td>
          <td class="text-right" style="color:#16a34a; font-weight:700;">-${discount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺</td>
        </tr>
        ` : ""}
        <tr>
          <td style="color:#64748b;">Dâhilî KDV (%20):</td>
          <td class="text-right">${kdvAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺</td>
        </tr>
        <tr class="grand-total">
          <td>Genel Toplam:</td>
          <td class="text-right">${order.totalPrice.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺</td>
        </tr>
      </table>
    </div>

    <!-- Dipnot -->
    <div style="margin-top: 3rem; padding-top: 1rem; border-top: 1px solid #e2e8f0; font-size: 0.75rem; color: #94a3b8; text-align: center;">
    <!-- Auto Print Script -->
    <script>
      window.addEventListener('load', function() {
        setTimeout(function() { window.print(); }, 300);
      });
    </script>
  </div>

</body>
</html>
    `;

    return new NextResponse(htmlContent, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Invoice API Error:", error);
    return new NextResponse("Fatura oluşturulurken hata oluştu", { status: 500 });
  }
}
