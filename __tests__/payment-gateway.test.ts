import { describe, it, expect } from "vitest";
import {
  SimulatedPaymentGatewayAdapter,
  defaultPaymentGateway,
} from "@/lib/services/payment-gateway.service";

describe("Demo & Simulated Payment Gateway Architecture", () => {
  const gateway = new SimulatedPaymentGatewayAdapter();

  it("should process CREDIT_CARD as COMPLETED simulated payment with transactionId", async () => {
    const result = await gateway.processPayment({
      orderId: "order_test_12345678",
      amount: 1499.99,
      paymentMethodType: "CREDIT_CARD",
      paymentMethodProvider: "MOCK_GATEWAY",
      userId: "user_test_1",
    });

    expect(result.isSimulated).toBe(true);
    expect(result.status).toBe("COMPLETED");
    expect(result.paidAt).toBeInstanceOf(Date);
    expect(result.transactionId).toMatch(/^SIM_TX_/);
    expect(result.message).toContain("Simüle");
  });

  it("should process BANK_TRANSFER as PENDING payment waiting for manual transfer in demo mode", async () => {
    const result = await gateway.processPayment({
      orderId: "order_test_87654321",
      amount: 4500.0,
      paymentMethodType: "BANK_TRANSFER",
      paymentMethodProvider: "MOCK_BANK",
      userId: "user_test_2",
    });

    expect(result.isSimulated).toBe(true);
    expect(result.status).toBe("PENDING");
    expect(result.paidAt).toBeNull();
    expect(result.transactionId).toMatch(/^SIM_TX_/);
    expect(result.message).toContain("Bekleniyor");
  });

  it("defaultPaymentGateway export should be an instance of SimulatedPaymentGatewayAdapter", () => {
    expect(defaultPaymentGateway).toBeInstanceOf(SimulatedPaymentGatewayAdapter);
  });
});
