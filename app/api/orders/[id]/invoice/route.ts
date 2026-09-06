import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { getClientIdentifier, checkRateLimit, rateLimitResponse } from "@/lib/rate-limiter";
import { calculateInvoice } from "@/lib/utils/invoice-calculator";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: clerkUser.emailAddresses[0].emailAddress },
      select: { id: true, role: true },
    });

    if (!dbUser) {
      return new NextResponse("Kullanıcı bulunamadı", { status: 404 });
    }

    const identifier = getClientIdentifier(request, dbUser.id);
    const rateLimit = await checkRateLimit(identifier, { limit: 20, windowSeconds: 60 });
    if (!rateLimit.success) {
      return rateLimitResponse(rateLimit, "Çok fazla fatura indirme talebinde bulundunuz.");
    }

    const resolvedParams = await params;
    const orderId = resolvedParams.id;

    // Sipariş bilgilerini derin ilişkileriyle çekiyoruz
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { name: true, email: true } },
        address: true,
        payment: { include: { paymentMethod: true } },
        shipment: true,
        items: {
          include: {
            product: { select: { name: true, sku: true } },
            variant: { select: { combination: true, sku: true } },
          },
        },
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
    const storeName = env.NEXT_PUBLIC_STORE_NAME || "TEKNOSHOP TEKNOLOJİ A.Ş.";
    const storeAddress = storeSettings?.address || "Büyükdere Cad. No:123, Levent / İstanbul";
    const storePhone = storeSettings?.phone || "0850 123 45 67";
    const storeEmail = storeSettings?.email || "fatura@teknoshop.com";

    // Merkezi Fatura ve KDV Hesaplama Motoru (BE-08 Unified Calculator)
    const invoice = calculateInvoice({
      totalPrice: order.totalPrice,
      discountAmount: order.discountAmount,
      items: order.items.map((i) => ({ price: i.price, quantity: i.quantity })),
      paymentFee: order.payment?.paymentMethod?.fee,
    });

    const orderCode = `#ORD-${order.id.slice(-8).toUpperCase()}`;
    const formattedDate = new Date(order.createdAt).toLocaleDateString("tr-TR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // JSON Format Talebi (Modal veya headless tüketim için)
    const url = new URL(request.url);
    if (url.searchParams.get("format") === "json") {
      return NextResponse.json({
        success: true,
        orderCode,
        formattedDate,
        store: { name: storeName, address: storeAddress, phone: storePhone, email: storeEmail },
        customer: {
          name: order.user?.name || "Değerli Müşterimiz",
          email: order.user?.email || "-",
          address: order.address,
        },
        payment: {
          method: order.payment?.paymentMethod?.name || "Kredi Kartı / Banka",
          status: order.payment?.status === "COMPLETED" ? "Ödendi" : "Bekliyor",
          fee: invoice.paymentFee,
        },
        shipment: {
          company: order.shipment?.company || "Yurtiçi Kargo",
          trackingNumber: order.shipment?.trackingNumber || "Hazırlanıyor",
          cost: invoice.shippingCost,
        },
        items: order.items.map((item) => ({
          id: item.id,
          name: item.product?.name || "Ürün",
          combination: item.variant?.combination || null,
          sku: item.variant?.sku || item.product?.sku || "-",
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity,
        })),
        calculation: invoice,
      });
    }

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
    .totals-table { width: 340px; margin-left: auto; }
    .totals-table td { padding: 0.5rem 1rem; font-size: 0.88rem; }
    .grand-total { font-size: 1.15rem; font-weight: 900; color: #1e3a8a; background: #eff6ff; }
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
        <p style="font-size:0.85rem; color:#64748b; margin:0.25rem 0 0 0;">${storeAddress} | Tel: ${storePhone} | E-posta: ${storeEmail}</p>
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
          <th>SKU / Kod</th>
          <th class="text-right">Adet</th>
          <th class="text-right">Birim Fiyat</th>
          <th class="text-right">Toplam</th>
        </tr>
      </thead>
      <tbody>
        ${order.items
          .map(
            (item) => `
          <tr>
            <td>
              <strong>${item.product.name}</strong>
              ${item.variant?.combination ? `<br><small style="color:#64748b;">${item.variant.combination}</small>` : ""}
            </td>
            <td><code>${item.variant?.sku || item.product.sku || "-"}</code></td>
            <td class="text-right">${item.quantity}</td>
            <td class="text-right">${item.price.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺</td>
            <td class="text-right"><strong>${(item.price * item.quantity).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺</strong></td>
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>

    <!-- Alt Toplamlar (BE-08 Unified Line Item & Tax Breakdown) -->
    <table class="totals-table">
      <tr>
        <td>Ürünler Toplamı:</td>
        <td class="text-right font-mono">${invoice.subTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺</td>
      </tr>
      ${
        invoice.discount > 0
          ? `
      <tr>
        <td style="color: #16a34a;">Kupon İndirimi:</td>
        <td class="text-right font-mono" style="color: #16a34a;">-${invoice.discount.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺</td>
      </tr>`
          : ""
      }
      <tr>
        <td>Kargo Ücreti:</td>
        <td class="text-right font-mono">${invoice.shippingCost === 0 ? '<span style="color: #16a34a; font-weight: 700;">Ücretsiz</span>' : `${invoice.shippingCost.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺`}</td>
      </tr>
      ${
        invoice.paymentFee > 0
          ? `
      <tr>
        <td>Ödeme Hizmet Bedeli:</td>
        <td class="text-right font-mono">${invoice.paymentFee.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺</td>
      </tr>`
          : ""
      }
      <tr style="border-top: 1px dashed #cbd5e1;">
        <td style="color: #64748b; font-size: 0.8rem;">KDV Hariç Matrah:</td>
        <td class="text-right font-mono" style="color: #64748b; font-size: 0.8rem;">${invoice.netAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺</td>
      </tr>
      <tr>
        <td style="color: #64748b; font-size: 0.8rem;">Hesaplanan KDV (%20 Dahil):</td>
        <td class="text-right font-mono" style="color: #64748b; font-size: 0.8rem;">${invoice.kdvAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺</td>
      </tr>
      <tr class="grand-total">
        <td>Genel Toplam:</td>
        <td class="text-right font-mono">${invoice.totalPrice.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺</td>
      </tr>
    </table>

    <div style="margin-top: 3rem; border-top: 1px dashed #cbd5e1; padding-top: 1rem; text-align: center; font-size: 0.75rem; color: #94a3b8;">
      Bu belge 213 sayılı Vergi Usul Kanunu uyarınca elektronik ortamda düzenlenmiştir.
    </div>
  </div>

</body>
</html>
    `;

    return new NextResponse(htmlContent, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Fatura oluşturulurken hata:", error);
    return new NextResponse("Fatura oluşturulamadı", { status: 500 });
  }
}
