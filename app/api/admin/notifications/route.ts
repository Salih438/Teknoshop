import { NextResponse } from "next/server";
import { checkIsAdmin } from "@/lib/auth-utils";
import { AdminNotificationService } from "@/lib/services/admin-notification.service";

export async function GET(request: Request) {
  try {
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") || "all";

    const data = await AdminNotificationService.getNotifications(filter);
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("GET Admin Notifications Hata:", error);
    return NextResponse.json({ error: "Bildirimler alınamadı." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    const body = await request.json();
    const { action, id } = body;

    if (action === "markAll") {
      await AdminNotificationService.markAllAsRead();
      return NextResponse.json({ success: true }, { status: 200 });
    }

    if (action === "markOne" && id) {
      await AdminNotificationService.markAsRead(id);
      return NextResponse.json({ success: true }, { status: 200 });
    }

    return NextResponse.json({ error: "Geçersiz aksiyon." }, { status: 400 });
  } catch (error) {
    console.error("PATCH Admin Notifications Hata:", error);
    return NextResponse.json({ error: "İşlem başarısız." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    const body = await request.json();
    const { action, ids } = body;

    if (action === "deleteAll") {
      await AdminNotificationService.deleteAllNotifications();
      return NextResponse.json({ success: true }, { status: 200 });
    }

    if (action === "deleteSelected" && Array.isArray(ids)) {
      await AdminNotificationService.deleteNotifications(ids);
      return NextResponse.json({ success: true }, { status: 200 });
    }

    return NextResponse.json({ error: "Geçersiz aksiyon." }, { status: 400 });
  } catch (error) {
    console.error("DELETE Admin Notifications Hata:", error);
    return NextResponse.json({ error: "İşlem başarısız." }, { status: 500 });
  }
}
