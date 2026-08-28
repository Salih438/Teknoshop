import { describe, it, expect } from "vitest";
import {
  ACTIVE_EXCHANGE_STATUSES,
  ACTIVE_RETURN_STATUSES,
  isStatusTransitionAllowed,
} from "@/lib/constants/order-status";

describe("Order & Request Status Engine", () => {
  it("ACTIVE_EXCHANGE_STATUSES should include all in-progress states and exclude terminal states", () => {
    expect(ACTIVE_EXCHANGE_STATUSES).toContain("PENDING");
    expect(ACTIVE_EXCHANGE_STATUSES).toContain("APPROVED");
    expect(ACTIVE_EXCHANGE_STATUSES).toContain("WAITING_FOR_CUSTOMER");
    expect(ACTIVE_EXCHANGE_STATUSES).toContain("WAITING_STOCK");
    expect(ACTIVE_EXCHANGE_STATUSES).toContain("SHIPPED");
    expect(ACTIVE_EXCHANGE_STATUSES).toContain("RECEIVED");
    expect(ACTIVE_EXCHANGE_STATUSES).toContain("PROCESSING");

    // Terminal states must NOT be in active list
    expect(ACTIVE_EXCHANGE_STATUSES).not.toContain("COMPLETED");
    expect(ACTIVE_EXCHANGE_STATUSES).not.toContain("REJECTED");
  });

  it("ACTIVE_RETURN_STATUSES should include active states and exclude COMPLETED and REJECTED", () => {
    expect(ACTIVE_RETURN_STATUSES).toContain("PENDING");
    expect(ACTIVE_RETURN_STATUSES).toContain("APPROVED");
    expect(ACTIVE_RETURN_STATUSES).toContain("SHIPPED");
    expect(ACTIVE_RETURN_STATUSES).toContain("RECEIVED");

    expect(ACTIVE_RETURN_STATUSES).not.toContain("COMPLETED");
    expect(ACTIVE_RETURN_STATUSES).not.toContain("REJECTED");
  });

  it("isStatusTransitionAllowed should validate legal state machine transitions", () => {
    expect(isStatusTransitionAllowed("PENDING", "PROCESSING")).toBe(true);
    expect(isStatusTransitionAllowed("PENDING", "CANCELLED")).toBe(true);
    expect(isStatusTransitionAllowed("PENDING", "DELIVERED")).toBe(false);

    expect(isStatusTransitionAllowed("PROCESSING", "SHIPPED")).toBe(true);
    expect(isStatusTransitionAllowed("PROCESSING", "DELIVERED")).toBe(false);

    expect(isStatusTransitionAllowed("SHIPPED", "DELIVERED")).toBe(true);
    expect(isStatusTransitionAllowed("DELIVERED", "PROCESSING")).toBe(false);
  });
});
