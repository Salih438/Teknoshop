"use client";

import DynamicPaymentForm from "./DynamicPaymentForm";

interface BankAccountDTO {
  id: string;
  bankName: string;
  accountHolder: string;
  iban: string;
  currency: string;
}

export interface PaymentMethodDTO {
  id: string;
  name: string;
  description: string | null;
  type: "CREDIT_CARD" | "BANK_TRANSFER" | "CASH_ON_DELIVERY" | "DIGITAL_WALLET" | "INSTALLMENT";
  provider: string;
  fee: number;
  icon?: string | null;
  bankAccounts?: BankAccountDTO[];
}

interface PaymentMethodsProps {
  paymentMethods: PaymentMethodDTO[];
  paymentMethodId: string;
  setPaymentMethodId: (id: string) => void;
  onCardDataChange?: (data: { cardNumber: string; cardHolder: string; expiryDate: string; cvc: string }) => void;
}

export default function PaymentMethods({
  paymentMethods,
  paymentMethodId,
  setPaymentMethodId,
  onCardDataChange,
}: PaymentMethodsProps) {
  const selectedMethod = paymentMethods.find((p) => p.id === paymentMethodId);

  return (
    <div className="space-y-6 text-left">
      
      {/* 🚀 1. APPLE STORE STYLE CHECKOUT TIMELINE (İLERLEME ADIMLARI) */}
      <div className="bg-gray-50/80 p-4 rounded-3xl border border-gray-200/80 mb-6">
        <div className="flex items-center justify-between max-w-md mx-auto text-xs font-bold">
          <div className="flex items-center gap-1.5 text-green-600">
            <span className="w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-black text-xs">✓</span>
            <span>Sepet</span>
          </div>

          <div className="h-0.5 w-8 bg-green-500" />

          <div className="flex items-center gap-1.5 text-green-600">
            <span className="w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-black text-xs">✓</span>
            <span>Teslimat</span>
          </div>

          <div className="h-0.5 w-8 bg-blue-500" />

          <div className="flex items-center gap-1.5 text-blue-600">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-xs">3</span>
            <span className="font-black">Ödeme</span>
          </div>

          <div className="h-0.5 w-8 bg-gray-200" />

          <div className="flex items-center gap-1.5 text-gray-400">
            <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center font-black text-xs">4</span>
            <span>Onay</span>
          </div>
        </div>
      </div>

      {/* 🚀 2. DİNAMİK ÖDEME YÖNTEMLERİ SEÇİM KARTLARI */}
      <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-4">
        <h3 className="text-lg font-black text-gray-900 border-b border-gray-100 pb-3 flex items-center justify-between">
          <span>💳 Ödeme Yöntemini Seçin</span>
          <span className="text-xs font-bold text-gray-400">({paymentMethods.length} Seçenek)</span>
        </h3>

        <div className="space-y-3">
          {paymentMethods.map((method) => {
            const isSelected = method.id === paymentMethodId;
            return (
              <div
                key={method.id}
                onClick={() => setPaymentMethodId(method.id)}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? "border-blue-600 bg-blue-50/40 shadow-sm"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={isSelected}
                      onChange={() => setPaymentMethodId(method.id)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <h4 className="font-extrabold text-sm text-gray-900 flex items-center gap-2">
                        <span>{method.type === "CREDIT_CARD" ? "💳" : method.type === "BANK_TRANSFER" ? "🏦" : "🚚"}</span>
                        <span>{method.name}</span>
                      </h4>
                      {method.description && (
                        <p className="text-xs text-gray-500 font-medium mt-0.5">{method.description}</p>
                      )}
                    </div>
                  </div>

                  {method.fee > 0 && (
                    <span className="bg-orange-100 text-orange-800 text-[10px] font-extrabold px-2.5 py-1 rounded-full">
                      +{method.fee.toLocaleString("tr-TR")} ₺ Hizmet Bedeli
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 🚀 3. SEÇİLİ YÖNTEMİN DİNAMİK FORM PANELİ */}
        {selectedMethod && (
          <div className="pt-4 border-t border-gray-100">
            <DynamicPaymentForm selectedMethod={selectedMethod} onCardDataChange={onCardDataChange} />
          </div>
        )}
      </div>

      {/* 🚀 4. ENTERPRISE GÜVEN ROZETLERİ (TRUST BADGES) */}
      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 text-center space-y-2">
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs font-extrabold text-gray-600">
          <span className="flex items-center gap-1">🔒 256-Bit SSL Encryption</span>
          <span className="flex items-center gap-1">🛡️ PCI-DSS Level 1 Compliant</span>
          <span className="flex items-center gap-1">⚡ 3D Secure 2.0</span>
          <span className="flex items-center gap-1">⚖️ KVKK Uyumlu</span>
        </div>
      </div>

    </div>
  );
}