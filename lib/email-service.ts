/**
 * Transactional Email Service
 * Resend / SendGrid / Nodemailer altyapısına hazır kurumsal e-posta servis katmanı.
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

export class EmailService {
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

      console.log(`
      ===============================================================
      📧 [TRANSACTIONAL MAIL - ORDER CONFIRMATION]
      ---------------------------------------------------------------
      Alıcı: ${userName} <${userEmail}>
      Konu: 🎉 Siparişiniz Alındı! (${orderCode})
      
      Sayın ${userName},
      
      Siparişiniz başarıyla veritabanımıza kaydedilmiştir.
      Sipariş Kodu: ${orderCode}
      Toplam Tutar: ${order.totalPrice.toLocaleString("tr-TR")} ₺
      
      Ürün Sayısı: ${order.items?.length || 0} Kalem
      Bizi tercih ettiğiniz için teşekkür ederiz. - Teknoshop Ekibi
      ===============================================================
      `);

      return true;
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
      const tracking = trackingNumber || "Henüz Girilmedi";

      console.log(`
      ===============================================================
      📧 [TRANSACTIONAL MAIL - ORDER SHIPPED]
      ---------------------------------------------------------------
      Alıcı: ${userName} <${userEmail}>
      Konu: 🚚 Siparişiniz Kargoya Verildi! (${orderCode})
      
      Sayın ${userName},
      
      ${orderCode} nolu siparişiniz kargoya verilmiştir!
      Kargo Firması: ${carrier}
      Takip Numarası: ${tracking}
      
      Siparişinizi profilinizdeki "Siparişlerim" sekmesinden takip edebilirsiniz.
      ===============================================================
      `);

      return true;
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

      console.log(`
      ===============================================================
      📧 [TRANSACTIONAL MAIL - RETURN APPROVED]
      ---------------------------------------------------------------
      Alıcı: ${userName} <${userEmail}>
      Konu: 🔄 İade Talebiniz Onaylandı! (${returnCode})
      
      Sayın ${userName},
      
      ${returnCode} nolu iade talebiniz yöneticilerimiz tarafından onaylanmıştır.
      Ücretsiz İade Kargo Kodunuz: ${tracking}
      
      Lütfen ürünü orijinal kutusunda kargo şubesine teslim ediniz.
      ===============================================================
      `);

      return true;
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

      console.log(`
      ===============================================================
      📧 [TRANSACTIONAL MAIL - RETURN REJECTED]
      ---------------------------------------------------------------
      Alıcı: ${userName} <${userEmail}>
      Konu: ❌ İade Talebiniz Hakkında Bilgilendirme (${returnCode})
      
      Sayın ${userName},
      
      ${returnCode} nolu iade talebiniz inceleme sonucu reddedilmiştir.
      RedGerekçesi: ${reason}
      
      Detaylı bilgi için müşteri hizmetlerimizle iletişime geçebilirsiniz.
      ===============================================================
      `);

      return true;
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

      console.log(`
      ===============================================================
      📧 [TRANSACTIONAL MAIL - RETURN COMPLETED]
      ---------------------------------------------------------------
      Alıcı: ${userName} <${userEmail}>
      Konu: 💳 İade Tutarı Hesabınıza Aktarıldı (${returnCode})
      
      Sayın ${userName},
      
      ${returnCode} nolu iade talebinize ait ${refundAmount.toLocaleString("tr-TR")} ₺ tutarındaki geri ödeme işleminiz tamamlanmıştır.
      İade tutarı 2-5 iş günü içerisinde kartınıza/hesabınıza yansıyacaktır.
      ===============================================================
      `);

      return true;
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

      console.log(`
      ===============================================================
      📧 [TRANSACTIONAL MAIL - EXCHANGE APPROVED]
      ---------------------------------------------------------------
      Alıcı: ${userName} <${userEmail}>
      Konu: 🔁 Ürün Değişim Talebiniz Onaylandı! (${exchangeCode})
      
      Sayın ${userName},
      
      ${exchangeCode} nolu ürün değişim talebiniz onaylanmıştır.
      Ücretsiz İade Kargo Kodunuz: ${tracking}
      
      Mevcut ürünü kargoya teslim ettikten sonra yeni ürününüz hazırlanacaktır.
      ===============================================================
      `);

      return true;
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

      console.log(`
      ===============================================================
      📧 [TRANSACTIONAL MAIL - EXCHANGE REJECTED]
      ---------------------------------------------------------------
      Alıcı: ${userName} <${userEmail}>
      Konu: ❌ Değişim Talebiniz Hakkında Bilgilendirme (${exchangeCode})
      
      Sayın ${userName},
      
      ${exchangeCode} nolu ürün değişim talebiniz inceleme sonucu reddedilmiştir.
      Red Gerekçesi: ${reason}
      
      Sorularınız için destek ekibimizle iletişime geçebilirsiniz.
      ===============================================================
      `);

      return true;
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

      console.log(`
      ===============================================================
      📧 [TRANSACTIONAL MAIL - EXCHANGE RECEIVED]
      ---------------------------------------------------------------
      Alıcı: ${userName} <${userEmail}>
      Konu: 📦 Değişim Ürününüz Depomuza Ulaştı (${exchangeCode})
      
      Sayın ${userName},
      
      ${exchangeCode} nolu değişim için gönderdiğiniz ürün depomuza ulaşmış ve teslim alınmıştır.
      İncelemenin ardından yeni ürününüz kargoya verilecektir.
      ===============================================================
      `);

      return true;
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

      console.log(`
      ===============================================================
      📧 [TRANSACTIONAL MAIL - EXCHANGE SHIPPED]
      ---------------------------------------------------------------
      Alıcı: ${userName} <${userEmail}>
      Konu: 🚚 Yeni Değişim Ürününüz Kargoya Verildi! (${exchangeCode})
      
      Sayın ${userName},
      
      ${exchangeCode} nolu talebinize ait yeni değişim ürününüz kargoya verilmiştir!
      Kargo Firması: ${carrier}
      Takip Numarası: ${tracking}
      ===============================================================
      `);

      return true;
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

      console.log(`
      ===============================================================
      📧 [TRANSACTIONAL MAIL - EXCHANGE COMPLETED]
      ---------------------------------------------------------------
      Alıcı: ${userName} <${userEmail}>
      Konu: ✨ Değişim İşleminiz Tamamlandı! (${exchangeCode})
      
      Sayın ${userName},
      
      ${exchangeCode} nolu ürün değişim süreciniz başarıyla tamamlanmıştır.
      Bizi tercih ettiğiniz için teşekkür ederiz. - Teknoshop Ekibi
      ===============================================================
      `);

      return true;
    } catch (error) {
      console.error("[EmailService.sendExchangeCompletedEmail Hata]:", error);
      return false;
    }
  }
}
