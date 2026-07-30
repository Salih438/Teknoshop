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
