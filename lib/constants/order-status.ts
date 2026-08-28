import { ReturnStatus, ExchangeStatus } from "@prisma/client";

export const ALLOWED_STATUS_TRANSITIONS = {
  PENDING: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
} as const;

export type OrderStatusKey = keyof typeof ALLOWED_STATUS_TRANSITIONS;

export function isStatusTransitionAllowed(currentStatus: string, targetStatus: string): boolean {
  if (currentStatus === targetStatus) return true;
  const allowedNextStatuses = ALLOWED_STATUS_TRANSITIONS[currentStatus as OrderStatusKey] || [];
  return (allowedNextStatuses as readonly string[]).includes(targetStatus);
}

// 🔁 Aktif / Bekleyen İade Talebi Durumları (COMPLETED ve REJECTED hariç)
export const ACTIVE_RETURN_STATUSES: readonly ReturnStatus[] = [
  ReturnStatus.PENDING,
  ReturnStatus.APPROVED,
  ReturnStatus.SHIPPED,
  ReturnStatus.RECEIVED,
] as const;

// 🔄 Aktif / Bekleyen Değişim Talebi Durumları (COMPLETED ve REJECTED hariç)
export const ACTIVE_EXCHANGE_STATUSES: readonly ExchangeStatus[] = [
  ExchangeStatus.PENDING,
  ExchangeStatus.APPROVED,
  ExchangeStatus.WAITING_FOR_CUSTOMER,
  ExchangeStatus.WAITING_STOCK,
  ExchangeStatus.SHIPPED,
  ExchangeStatus.RECEIVED,
  ExchangeStatus.PROCESSING,
] as const;

