import { getDbUser } from "@/lib/auth-utils";

export type Permission =
  | "VIEW_DASHBOARD"
  | "VIEW_ANALYTICS"
  | "MANAGE_PRODUCTS"
  | "DELETE_PRODUCTS"
  | "MANAGE_ORDERS"
  | "MANAGE_USERS"
  | "DELETE_USERS"
  | "MANAGE_COUPONS"
  | "MANAGE_RETURNS"
  | "MANAGE_EXCHANGES"
  | "MANAGE_NOTIFICATIONS"
  | "VIEW_AUDIT"
  | "MANAGE_SETTINGS"
  | "MANAGE_PAYMENT_METHODS"
  | "MANAGE_BRANDS"
  | "MANAGE_CATEGORIES"
  | "EXPORT_REPORTS"
  | "MANAGE_ROLES";

export type SystemRole = "SUPER_ADMIN" | "ADMIN" | "CUSTOMER_SUPPORT" | "CONTENT_MANAGER" | "ANALYST";

export const ALL_PERMISSIONS: Permission[] = [
  "VIEW_DASHBOARD",
  "VIEW_ANALYTICS",
  "MANAGE_PRODUCTS",
  "DELETE_PRODUCTS",
  "MANAGE_ORDERS",
  "MANAGE_USERS",
  "DELETE_USERS",
  "MANAGE_COUPONS",
  "MANAGE_RETURNS",
  "MANAGE_EXCHANGES",
  "MANAGE_NOTIFICATIONS",
  "VIEW_AUDIT",
  "MANAGE_SETTINGS",
  "MANAGE_PAYMENT_METHODS",
  "MANAGE_BRANDS",
  "MANAGE_CATEGORIES",
  "EXPORT_REPORTS",
  "MANAGE_ROLES",
];

export const ROLE_PERMISSIONS: Record<SystemRole, Permission[]> = {
  SUPER_ADMIN: ALL_PERMISSIONS,
  ADMIN: [
    "VIEW_DASHBOARD",
    "VIEW_ANALYTICS",
    "MANAGE_PRODUCTS",
    "DELETE_PRODUCTS",
    "MANAGE_ORDERS",
    "MANAGE_USERS",
    "MANAGE_COUPONS",
    "MANAGE_RETURNS",
    "MANAGE_EXCHANGES",
    "MANAGE_NOTIFICATIONS",
    "MANAGE_SETTINGS",
    "MANAGE_PAYMENT_METHODS",
    "MANAGE_BRANDS",
    "MANAGE_CATEGORIES",
    "EXPORT_REPORTS",
  ],
  CUSTOMER_SUPPORT: [
    "VIEW_DASHBOARD",
    "MANAGE_ORDERS",
    "MANAGE_RETURNS",
    "MANAGE_EXCHANGES",
    "MANAGE_USERS",
    "MANAGE_NOTIFICATIONS",
  ],
  CONTENT_MANAGER: [
    "VIEW_DASHBOARD",
    "MANAGE_PRODUCTS",
    "MANAGE_BRANDS",
    "MANAGE_CATEGORIES",
  ],
  ANALYST: [
    "VIEW_DASHBOARD",
    "VIEW_ANALYTICS",
    "VIEW_AUDIT",
    "EXPORT_REPORTS",
  ],
};

/**
 * Belirli bir rolün verilen izne sahip olup olmadığını kontrol eder.
 */
export function hasPermission(systemRole: SystemRole, permission: Permission): boolean {
  if (systemRole === "SUPER_ADMIN") return true;
  const permissions = ROLE_PERMISSIONS[systemRole] || [];
  return permissions.includes(permission);
}

/**
 * Giriş yapan aktif yöneticinin belirtilen yetkiye sahip olup olmadığını doğrular.
 */
export async function checkPermission(permission: Permission): Promise<boolean> {
  try {
    const dbUser = await getDbUser();
    if (!dbUser || dbUser.role !== "ADMIN") return false;
    return hasPermission(dbUser.systemRole, permission);
  } catch (error: any) {
    if (error?.message?.includes("Dynamic server usage")) {
      return false;
    }
    console.error("checkPermission Hata:", error);
    return false;
  }
}

