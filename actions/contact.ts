"use server";

import { AdminNotificationService } from "@/lib/services/admin-notification.service";
import { revalidatePath } from "next/cache";

export interface ContactInput {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
}

export async function submitContactAction(input: ContactInput) {
  try {
    const { name, email, phone, subject, message } = input;

    if (!name || name.trim().length < 2) {
      return { success: false, error: "Lütfen geçerli bir isim giriniz." };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      return { success: false, error: "Lütfen geçerli bir e-posta adresi giriniz." };
    }

    if (!message || message.trim().length < 10) {
      return { success: false, error: "Mesajınız en az 10 karakter olmalıdır." };
    }

    const subjectText = subject ? subject.trim() : "Genel Destek";
    const phoneText = phone ? phone.trim() : "";
    const orderOrSubjectCode = `[${subjectText}]`;
    const phoneInfoStr = phoneText ? ` (Tel: ${phoneText})` : "";

    const metadataPayload = JSON.stringify({
      type: "CONTACT_FORM",
      name: name.trim(),
      email: email.trim(),
      phone: phoneText,
      subject: subjectText,
      fullMessage: message.trim(),
    });

    // Admin paneline bildirim oluştur (Tam mesaj saklanır, metadata detay verisini barındırır)
    await AdminNotificationService.createNotification({
      type: "SYSTEM",
      title: `📬 İletişim Mesajı: ${name.trim()}`,
      message: `${orderOrSubjectCode} ${message.trim()} (E-Posta: ${email.trim()})${phoneInfoStr}`,
      link: "/admin/notifications",
      metadata: metadataPayload,
    });

    revalidatePath("/admin/notifications");

    return {
      success: true,
      message: "Mesajınız başarıyla iletildi. En kısa sürede sizinle iletişime geçeceğiz.",
    };
  } catch (error: unknown) {
    console.error("submitContactAction Hata:", error);
    return {
      success: false,
      error: "Mesaj iletilirken bir hata oluştu. Lütfen daha sonra tekrar deneyiniz.",
    };
  }
}
