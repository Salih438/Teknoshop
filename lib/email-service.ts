/**
 * Transactional Email Service
 * Resend REST API & Cloud SMTP destekli, güvenli fallback mekanizmalı kurumsal e-posta servis katmanı.
 */

export interface OrderEmailDTO {
  id: string;
  totalPrice: number;
  discountAmount?: number;
  items?: Array<{
    quantity: number;
    price: number;
    product?: { name: string } | null;
  }>;
}

export interface SendEmailPayload {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  simulated?: boolean;
  error?: string;
}

export class EmailService {
  private static readonly RESEND_API_URL = "https://api.resend.com/emails";

  /**
   * 📬 Çekirdek E-Posta Gönderim Motoru (Resend HTTP REST API + Graceful Console Fallback)
   */
  private static async dispatchEmail(payload: SendEmailPayload): Promise<SendEmailResult> {
    const resendApiKey = process.env.RESEND_API_KEY?.trim();
    const emailFrom = process.env.EMAIL_FROM?.trim() || "Teknoshop <onboarding@resend.dev>";

    // 1. GERÇEK SAĞLAYICI (Resend REST API Entegrasyonu)
    if (resendApiKey) {
      try {
        const response = await fetch(this.RESEND_API_URL, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: emailFrom,
            to: [payload.to],
            subject: payload.subject,
            text: payload.text,
            html: payload.html || payload.text.replace(/\n/g, "<br/>"),
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.warn("[EmailService] Resend API Hatası:", errorData);
          return {
            success: false,
            error: errorData.message || `HTTP ${response.status}`,
          };
        }

        const data = await response.json();
        return {
          success: true,
          messageId: data.id,
          simulated: false,
        };
      } catch (networkError: unknown) {
        console.error("[EmailService] E-posta gönderim ağ hatası:", networkError);
        return {
          success: false,
          error: networkError instanceof Error ? networkError.message : "Network error",
        };
      }
    }

    // 2. GÜVENLİ FALLBACK (Console Logger - API Key Olmadığında Build & Run Bozmaz)
    console.log(`
    ===============================================================
    📧 [SIMULATED TRANSACTIONAL EMAIL - NO RESEND_API_KEY CONFIGURED]
    ---------------------------------------------------------------
    Gönderen: ${emailFrom}
    Alıcı: ${payload.to}
    Konu: ${payload.subject}
    
    ${payload.text}
    ===============================================================
    `);

    return {
      success: true,
      simulated: true,
    };
  }

  /**
   * 🛒 Sipariş Onay E-postası Gönderimi
   */
  static async sendOrderConfirmationEmail(
    order: OrderEmailDTO,
    userEmail: string,
    userName: string
  ): Promise<boolean> {
    try {
      const orderCode = `#ORD-${order.id.slice(-8).toUpperCase()}`;
      const subject = `🎉 Siparişiniz Alındı! (${orderCode}) - Teknoshop`;

      const textBody = `Sayın ${userName},

Siparişiniz başarıyla veritabanımıza kaydedilmiştir.
Sipariş Kodu: ${orderCode}
Toplam Tutar: ${order.totalPrice.toLocaleString("tr-TR")} ₺
${order.discountAmount ? `İndirim Tutarı: ${order.discountAmount.toLocaleString("tr-TR")} ₺\n` : ""}
Siparişinizin durumunu dilediğiniz an "Hesabım > Siparişlerim" sayfasından takip edebilirsiniz.

Bizi tercih ettiğiniz için teşekkür ederiz.
Teknoshop Ekibi`;

      const htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #2563eb; margin: 0;">Teknoshop</h1>
            <p style="color: #6b7280; font-size: 14px;">Teknoloji ve Elektronik Dünyası</p>
          </div>
          <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #166534; font-size: 18px; margin-top: 0;">🎉 Tebrikler, Siparişiniz Alındı!</h2>
            <p style="color: #374151; font-size: 14px; margin-bottom: 0;">Sayın <strong>${userName}</strong>, siparişiniz başarıyla işleme alınmıştır.</p>
          </div>
          <table style="width: 100%; font-size: 14px; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Sipariş Kodu:</td>
              <td style="padding: 8px 0; font-weight: bold; text-align: right; color: #1f2937;">${orderCode}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Toplam Tutar:</td>
              <td style="padding: 8px 0; font-weight: bold; text-align: right; color: #2563eb; font-size: 16px;">${order.totalPrice.toLocaleString("tr-TR")} ₺</td>
            </tr>
            ${order.discountAmount ? `
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Kupon İndirimi:</td>
              <td style="padding: 8px 0; font-weight: bold; text-align: right; color: #16a34a;">-${order.discountAmount.toLocaleString("tr-TR")} ₺</td>
            </tr>` : ""}
          </table>
          <p style="color: #6b7280; font-size: 12px; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 15px;">
            Bu e-posta otomatik olarak gönderilmiştir. Siparişinizi profilinizden takip edebilirsiniz.
          </p>
        </div>
      `;

      const result = await this.dispatchEmail({
        to: userEmail,
        subject,
        text: textBody,
        html: htmlBody,
      });

      return result.success;
    } catch (error) {
      console.error("[EmailService.sendOrderConfirmationEmail Hata]:", error);
      return false;
    }
  }

  /**
   * 🚚 Kargo Takip E-postası Gönderimi
   */
  static async sendOrderShippedEmail(
    orderId: string,
    userEmail: string,
    userName: string,
    trackingNumber?: string,
    company?: string
  ): Promise<boolean> {
    try {
      const orderCode = `#ORD-${orderId.slice(-8).toUpperCase()}`;
      const carrier = company || "Yurtiçi Kargo";
      const tracking = trackingNumber || "Sistemde Kayıtlı";
      const subject = `🚚 Siparişiniz Kargoya Verildi! (${orderCode}) - Teknoshop`;

      const textBody = `Sayın ${userName},

${orderCode} nolu siparişiniz kargoya verilmiştir!
Kargo Firması: ${carrier}
Takip Numarası: ${tracking}

Siparişinizi profilinizdeki "Siparişlerim" sekmesinden takip edebilirsiniz.

İyi günlerde kullanmanızı dileriz.
Teknoshop Ekibi`;

      const htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
          <h2 style="color: #2563eb; margin-top: 0;">🚚 Siparişiniz Yola Çıktı!</h2>
          <p style="color: #374151; font-size: 14px;">Sayın <strong>${userName}</strong>, <strong>${orderCode}</strong> nolu siparişiniz kargo firmasına teslim edilmiştir.</p>
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p style="margin: 4px 0; color: #475569; font-size: 14px;"><strong>Kargo Şirketi:</strong> ${carrier}</p>
            <p style="margin: 4px 0; color: #475569; font-size: 14px;"><strong>Takip Kodu:</strong> <span style="font-family: monospace; font-weight: bold;">${tracking}</span></p>
          </div>
          <p style="color: #6b7280; font-size: 12px; text-align: center;">Teknoshop - Güvenli Alışveriş</p>
        </div>
      `;

      const result = await this.dispatchEmail({
        to: userEmail,
        subject,
        text: textBody,
        html: htmlBody,
      });

      return result.success;
    } catch (error) {
      console.error("[EmailService.sendOrderShippedEmail Hata]:", error);
      return false;
    }
  }

  /**
   * 🔄 İade Onay E-postası Gönderimi
   */
  static async sendReturnApprovedEmail(
    returnId: string,
    userEmail: string,
    userName: string,
    returnTrackingNumber?: string
  ): Promise<boolean> {
    try {
      const returnCode = `#RET-${returnId.slice(-8).toUpperCase()}`;
      const tracking = returnTrackingNumber || "Anlaşmalı Kargo Kodu Bekleniyor";
      const subject = `🔄 İade Talebiniz Onaylandı (${returnCode}) - Teknoshop`;

      const textBody = `Sayın ${userName},

${returnCode} nolu iade talebiniz yöneticilerimiz tarafından onaylanmıştır.
Ücretsiz İade Kargo Kodunuz: ${tracking}

Lütfen ürünü orijinal kutusu ve faturasıyla birlikte anlaşmalı kargo şubesine teslim ediniz.

Teknoshop Destek Ekibi`;

      const result = await this.dispatchEmail({
        to: userEmail,
        subject,
        text: textBody,
      });

      return result.success;
    } catch (error) {
      console.error("[EmailService.sendReturnApprovedEmail Hata]:", error);
      return false;
    }
  }

  /**
   * ❌ İade Red E-postası Gönderimi
   */
  static async sendReturnRejectedEmail(
    returnId: string,
    userEmail: string,
    userName: string,
    reason: string
  ): Promise<boolean> {
    try {
      const returnCode = `#RET-${returnId.slice(-8).toUpperCase()}`;
      const subject = `❌ İade Talebiniz Hakkında Bilgilendirme (${returnCode}) - Teknoshop`;

      const textBody = `Sayın ${userName},

${returnCode} nolu iade talebiniz inceleme sonucu onaylanamamıştır.
Gerekçe: ${reason}

Detaylı bilgi için müşteri hizmetlerimizle iletişime geçebilirsiniz.

Teknoshop Destek Ekibi`;

      const result = await this.dispatchEmail({
        to: userEmail,
        subject,
        text: textBody,
      });

      return result.success;
    } catch (error) {
      console.error("[EmailService.sendReturnRejectedEmail Hata]:", error);
      return false;
    }
  }

  /**
   * 💳 İade Tamamlama & Ödeme İadesi E-postası Gönderimi
   */
  static async sendReturnCompletedEmail(
    returnId: string,
    userEmail: string,
    userName: string,
    refundAmount: number
  ): Promise<boolean> {
    try {
      const returnCode = `#RET-${returnId.slice(-8).toUpperCase()}`;
      const subject = `💳 İade Tutarınız Hesabınıza Aktarıldı (${returnCode}) - Teknoshop`;

      const textBody = `Sayın ${userName},

${returnCode} nolu iade talebinize ait ${refundAmount.toLocaleString("tr-TR")} ₺ tutarındaki geri ödeme işleminiz tamamlanmıştır.
Tutar bankanızın süreçlerine bağlı olarak 2-5 iş günü içerisinde kartınıza yansıyacaktır.

Bizi tercih ettiğiniz için teşekkür ederiz.
Teknoshop Finans Ekibi`;

      const result = await this.dispatchEmail({
        to: userEmail,
        subject,
        text: textBody,
      });

      return result.success;
    } catch (error) {
      console.error("[EmailService.sendReturnCompletedEmail Hata]:", error);
      return false;
    }
  }

  /**
   * 🔁 Değişim Onay E-postası Gönderimi
   */
  static async sendExchangeApprovedEmail(
    exchangeId: string,
    userEmail: string,
    userName: string,
    returnTrackingNumber?: string
  ): Promise<boolean> {
    try {
      const exchangeCode = `#EXC-${exchangeId.slice(-8).toUpperCase()}`;
      const tracking = returnTrackingNumber || "Anlaşmalı Kargo Kodu Bekleniyor";
      const subject = `🔁 Ürün Değişim Talebiniz Onaylandı (${exchangeCode}) - Teknoshop`;

      const textBody = `Sayın ${userName},

${exchangeCode} nolu ürün değişim talebiniz onaylanmıştır.
Ücretsiz Gönderim Kargo Kodunuz: ${tracking}

Mevcut ürünü kargoya verdikten sonra depomuz yeni ürününüzün çıkışını sağlayacaktır.

Teknoshop Destek Ekibi`;

      const result = await this.dispatchEmail({
        to: userEmail,
        subject,
        text: textBody,
      });

      return result.success;
    } catch (error) {
      console.error("[EmailService.sendExchangeApprovedEmail Hata]:", error);
      return false;
    }
  }

  /**
   * ❌ Değişim Red E-postası Gönderimi
   */
  static async sendExchangeRejectedEmail(
    exchangeId: string,
    userEmail: string,
    userName: string,
    reason: string
  ): Promise<boolean> {
    try {
      const exchangeCode = `#EXC-${exchangeId.slice(-8).toUpperCase()}`;
      const subject = `❌ Değişim Talebiniz Hakkında Bilgilendirme (${exchangeCode}) - Teknoshop`;

      const textBody = `Sayın ${userName},

${exchangeCode} nolu ürün değişim talebiniz inceleme sonucu reddedilmiştir.
Gerekçe: ${reason}

Sorularınız için destek ekibimizle iletişime geçebilirsiniz.

Teknoshop Destek Ekibi`;

      const result = await this.dispatchEmail({
        to: userEmail,
        subject,
        text: textBody,
      });

      return result.success;
    } catch (error) {
      console.error("[EmailService.sendExchangeRejectedEmail Hata]:", error);
      return false;
    }
  }

  /**
   * 📦 Değişim Ürünü Depoda Teslim Alındı E-postası Gönderimi
   */
  static async sendExchangeReceivedEmail(
    exchangeId: string,
    userEmail: string,
    userName: string
  ): Promise<boolean> {
    try {
      const exchangeCode = `#EXC-${exchangeId.slice(-8).toUpperCase()}`;
      const subject = `📦 Değişim Ürününüz Depomuza Ulaştı (${exchangeCode}) - Teknoshop`;

      const textBody = `Sayın ${userName},

${exchangeCode} nolu değişim için gönderdiğiniz ürün depomuza ulaşmış ve teslim alınmıştır.
Kalite kontrolün ardından yeni ürününüz kargoya verilecektir.

Teknoshop Lojistik Ekibi`;

      const result = await this.dispatchEmail({
        to: userEmail,
        subject,
        text: textBody,
      });

      return result.success;
    } catch (error) {
      console.error("[EmailService.sendExchangeReceivedEmail Hata]:", error);
      return false;
    }
  }

  /**
   * 🚚 Yeni Değişim Ürünü Kargoya Verildi E-postası Gönderimi
   */
  static async sendExchangeShippedEmail(
    exchangeId: string,
    userEmail: string,
    userName: string,
    trackingNumber?: string,
    company?: string
  ): Promise<boolean> {
    try {
      const exchangeCode = `#EXC-${exchangeId.slice(-8).toUpperCase()}`;
      const carrier = company || "Yurtiçi Kargo";
      const tracking = trackingNumber || "Henüz Girilmedi";
      const subject = `🚚 Yeni Değişim Ürününüz Kargoya Verildi! (${exchangeCode}) - Teknoshop`;

      const textBody = `Sayın ${userName},

${exchangeCode} nolu talebinize ait yeni ürününüz kargoya verilmiştir!
Kargo Firması: ${carrier}
Takip Numarası: ${tracking}

Teknoshop Ekibi`;

      const result = await this.dispatchEmail({
        to: userEmail,
        subject,
        text: textBody,
      });

      return result.success;
    } catch (error) {
      console.error("[EmailService.sendExchangeShippedEmail Hata]:", error);
      return false;
    }
  }

  /**
   * ✨ Değişim Süreci Tamamlandı E-postası Gönderimi
   */
  static async sendExchangeCompletedEmail(
    exchangeId: string,
    userEmail: string,
    userName: string
  ): Promise<boolean> {
    try {
      const exchangeCode = `#EXC-${exchangeId.slice(-8).toUpperCase()}`;
      const subject = `✨ Değişim İşleminiz Tamamlandı (${exchangeCode}) - Teknoshop`;

      const textBody = `Sayın ${userName},

${exchangeCode} nolu ürün değişim süreciniz başarıyla tamamlanmıştır.
Bizi tercih ettiğiniz için teşekkür ederiz.

Teknoshop Ekibi`;

      const result = await this.dispatchEmail({
        to: userEmail,
        subject,
        text: textBody,
      });

      return result.success;
    } catch (error) {
      console.error("[EmailService.sendExchangeCompletedEmail Hata]:", error);
      return false;
    }
  }
}
