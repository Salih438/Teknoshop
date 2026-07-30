export type NotificationType =
  | "ORDER_CREATED"
  | "ORDER_PREPARING"
  | "ORDER_SHIPPED"
  | "ORDER_DELIVERED"
  | "RETURN_APPROVED"
  | "RETURN_REJECTED"
  | "EXCHANGE_APPROVED"
  | "NEW_COUPON"
  | "NEW_CAMPAIGN"
  | "SYSTEM_ANNOUNCEMENT";

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  linkUrl?: string;
}

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    type: "ORDER_SHIPPED",
    title: "Siparişiniz Kargoya Verildi! 🚚",
    message: "#TR8492041284 nolu siparişiniz Yurtiçi Kargo firmasına teslim edilmiştir.",
    createdAt: "10 dakika önce",
    isRead: false,
    linkUrl: "/profile/orders/1",
  },
  {
    id: "notif-2",
    type: "NEW_COUPON",
    title: "Sana Özel 150 ₺ Kupon Tanımlandı! 🎟️",
    message: "1000 ₺ üzeri teknoloji alışverişlerinde geçerli 'TEKNO150' kuponunu kaçırma.",
    createdAt: "1 saat önce",
    isRead: false,
    linkUrl: "/checkout",
  },
  {
    id: "notif-3",
    type: "EXCHANGE_APPROVED",
    title: "Ürün Değişim Talebiniz Onaylandı! 🔁",
    message: "#EXC-98421 nolu değişim talebiniz onaylandı. Ücretsiz iade kargo kodunuz: YURTICI-4821",
    createdAt: "3 saat önce",
    isRead: false,
    linkUrl: "/profile/orders/1",
  },
  {
    id: "notif-4",
    type: "RETURN_APPROVED",
    title: "İade Tutarı Hesabınıza Aktarıldı 💳",
    message: "#RET-84210 nolu iade talebinize ait 1.250 ₺ kartınıza iade edilmiştir.",
    createdAt: "Dün, 14:30",
    isRead: true,
    linkUrl: "/profile/orders/1",
  },
  {
    id: "notif-5",
    type: "NEW_CAMPAIGN",
    title: "Büyük Yaz Fırsatları Başladı 🔥",
    message: "Kulaklık ve Akıllı Saat kategorilerinde %30'a varan indirimleri hemen keşfet.",
    createdAt: "2 gün önce",
    isRead: true,
    linkUrl: "/products",
  },
  {
    id: "notif-6",
    type: "SYSTEM_ANNOUNCEMENT",
    title: "Sistem Bakımı Bilgilendirmesi ⚙️",
    message: "28 Temmuz 03:00 - 04:00 saatleri arasında kısa süreli altyapı güncellemesi yapılacaktır.",
    createdAt: "3 gün önce",
    isRead: true,
  },
];

export const NOTIFICATION_TYPE_CONFIG: Record<
  string,
  { icon: string; bgClass: string; textClass: string; category: "orders" | "returns" | "campaigns" | "system" }
> = {
  ORDER_CREATED: { icon: "🛍️", bgClass: "bg-blue-50 border-blue-200", textClass: "text-blue-700", category: "orders" },
  ORDER_PREPARING: { icon: "📦", bgClass: "bg-amber-50 border-amber-200", textClass: "text-amber-700", category: "orders" },
  ORDER_SHIPPED: { icon: "🚚", bgClass: "bg-indigo-50 border-indigo-200", textClass: "text-indigo-700", category: "orders" },
  ORDER_DELIVERED: { icon: "✅", bgClass: "bg-green-50 border-green-200", textClass: "text-green-700", category: "orders" },
  RETURN_APPROVED: { icon: "🔄", bgClass: "bg-green-50 border-green-200", textClass: "text-green-700", category: "returns" },
  RETURN_REJECTED: { icon: "❌", bgClass: "bg-red-50 border-red-200", textClass: "text-red-700", category: "returns" },
  RETURN_COMPLETED: { icon: "💳", bgClass: "bg-emerald-50 border-emerald-200", textClass: "text-emerald-700", category: "returns" },
  EXCHANGE_APPROVED: { icon: "🔁", bgClass: "bg-purple-50 border-purple-200", textClass: "text-purple-700", category: "returns" },
  EXCHANGE_REJECTED: { icon: "❌", bgClass: "bg-rose-50 border-rose-200", textClass: "text-rose-700", category: "returns" },
  EXCHANGE_RECEIVED: { icon: "📦", bgClass: "bg-violet-50 border-violet-200", textClass: "text-violet-700", category: "returns" },
  EXCHANGE_SHIPPED: { icon: "🚚", bgClass: "bg-indigo-50 border-indigo-200", textClass: "text-indigo-700", category: "returns" },
  EXCHANGE_COMPLETED: { icon: "✨", bgClass: "bg-purple-50 border-purple-200", textClass: "text-purple-700", category: "returns" },
  NEW_COUPON: { icon: "🎟️", bgClass: "bg-amber-50 border-amber-200", textClass: "text-amber-700", category: "campaigns" },
  NEW_CAMPAIGN: { icon: "🔥", bgClass: "bg-rose-50 border-rose-200", textClass: "text-rose-700", category: "campaigns" },
  SYSTEM_ANNOUNCEMENT: { icon: "📢", bgClass: "bg-gray-100 border-gray-200", textClass: "text-gray-700", category: "system" },
};
