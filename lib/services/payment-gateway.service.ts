/**
 * IPaymentGatewayAdapter & SimulatedPaymentGatewayAdapter
 * 
 * Bu modül, TeknoShop staj/demo projesinde simüle edilmiş (mock) ödeme akışını
 * yönetir. Canlı bir satıcı hesabı veya gerçek kredi kartı tahsilatı İÇERMEZ.
 * Mimari olarak Hexagonal (Ports & Adapters) prensibine uygun interface sunarak
 * gelecekte gerçek bir ağ geçidinin (Iyzico, Stripe vb.) checkout akışını
 * bozmadan eklenebilmesini sağlar.
 */

export interface ProcessPaymentParams {
  orderId: string;
  amount: number;
  paymentMethodType: string;
  paymentMethodProvider: string;
  userId: string;
}

export interface PaymentProcessingResult {
  isSimulated: true;
  transactionId: string;
  status: "COMPLETED" | "PENDING";
  paidAt: Date | null;
  message: string;
}

export interface IPaymentGatewayAdapter {
  processPayment(params: ProcessPaymentParams): Promise<PaymentProcessingResult>;
}

export class SimulatedPaymentGatewayAdapter implements IPaymentGatewayAdapter {
  async processPayment(params: ProcessPaymentParams): Promise<PaymentProcessingResult> {
    const isCreditCard = params.paymentMethodType === "CREDIT_CARD";
    const transactionId = `SIM_TX_${params.orderId.slice(-8).toUpperCase()}_${Date.now()}`;

    return {
      isSimulated: true,
      transactionId,
      status: isCreditCard ? "COMPLETED" : "PENDING",
      paidAt: isCreditCard ? new Date() : null,
      message: isCreditCard
        ? "Simüle Kredi Kartı Ödemesi Onaylandı (Demo / Test Modu)"
        : "Havale / Kapıda Ödeme Bekleniyor (Demo / Test Modu)",
    };
  }
}

export const defaultPaymentGateway = new SimulatedPaymentGatewayAdapter();
