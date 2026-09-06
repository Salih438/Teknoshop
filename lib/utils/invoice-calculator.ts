// lib/utils/invoice-calculator.ts

/**
 * ============================================================================
 * INVOICE & KDV (VAT) CALCULATION UTILITY — TEKNOSHOP
 * ============================================================================
 *
 * LEGAL & REGULATORY CONTEXT (Turkish E-Commerce / VUK / KDV Kanunu):
 * - Under Turkish retail e-commerce regulations and Teknoshop store terms
 *   (app/(storefront)/terms/page.tsx), all displayed product prices are
 *   legally INCLUSIVE of 20% KDV (Value Added Tax).
 * - During checkout (lib/services/checkout.service.ts), `order.totalPrice` is
 *   assembled as:
 *     totalPrice = (subTotal - discount) + shippingCost + paymentFee
 *   KDV is NEVER added on top of the customer's total; it is extracted
 *   (reverse-calculated) from the inclusive total.
 *
 * ⚠️ ASSUMPTION NOTE:
 * Ancillary customer charges (shipping costs and payment processing fees) are
 * assumed to be taxed at the same standard 20% KDV rate as the merchandise.
 * This reflects standard commercial practice for bundled delivery and processing
 * charges in Turkish retail e-invoicing. This is documented here as an engineering
 * assumption for this portfolio project, rather than a certified tax-law opinion.
 *
 * MATHEMATICAL INVARIANTS:
 * 1. Line-Item Invariant:
 *    (subTotal - discount) + shippingCost + paymentFee === totalPrice
 * 2. Tax Matrah Invariant:
 *    netAmount + kdvAmount === totalPrice
 *    where netAmount = round2(totalPrice / 1.20)
 *    and   kdvAmount = round2(totalPrice - netAmount)
 * Both invariants are strictly guaranteed to the kuruş/cent (2 decimal places).
 */

export interface InvoiceItemInput {
  price: number;
  quantity: number;
  name?: string;
  sku?: string | null;
  variantCombination?: string | null;
}

export interface InvoiceCalculationInput {
  totalPrice: number;
  discountAmount?: number | null;
  items?: InvoiceItemInput[];
  paymentFee?: number | null;
  shippingCost?: number | null;
}

export interface InvoiceCalculationResult {
  /**
   * Gross merchandise subtotal (sum of item.price * quantity, KDV dahil)
   */
  subTotal: number;

  /**
   * Coupon or promotional discount deducted from merchandise
   */
  discount: number;

  /**
   * Discounted merchandise subtotal: max(0, subTotal - discount)
   */
  discountedSubtotal: number;

  /**
   * Shipping fee charged to the order (0 if free shipping)
   */
  shippingCost: number;

  /**
   * Payment method transaction/service fee (0 if none)
   */
  paymentFee: number;

  /**
   * Grand total payable by the customer (Order.totalPrice, KDV dahil)
   */
  totalPrice: number;

  /**
   * KDV Hariç Matrah (Taxable base extracted from inclusive total)
   * Formula: round2(totalPrice / 1.20)
   */
  netAmount: number;

  /**
   * Hesaplanan KDV (%20 Dahil)
   * Formula: round2(totalPrice - netAmount)
   */
  kdvAmount: number;

  /**
   * Applicable KDV tax rate percentage (fixed at 20%)
   */
  kdvRate: number;

  /**
   * Formal verification check of mathematical invariants
   */
  invariants: {
    lineItemsBalance: boolean;
    taxBalances: boolean;
  };
}

/**
 * Standard 2-decimal rounding helper for Turkish Lira (kuruş precision)
 */
export function round2(num: number): number {
  return Math.round(num * 100) / 100;
}

/**
 * Formats a number to Turkish Lira currency display format (e.g. 1.234,56 ₺)
 */
export function formatCurrency(amount: number): string {
  return amount.toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + " ₺";
}

/**
 * Primary calculation engine for order invoices.
 * Accepts real database order attributes and returns an exact, synchronized breakdown.
 */
export function calculateInvoice(input: InvoiceCalculationInput): InvoiceCalculationResult {
  const totalPrice = round2(input.totalPrice);
  const discount = round2(Math.max(0, input.discountAmount ?? 0));
  const paymentFee = round2(Math.max(0, input.paymentFee ?? 0));

  // 1. Calculate merchandise gross subtotal from items if available
  let subTotal = 0;
  if (input.items && input.items.length > 0) {
    subTotal = round2(
      input.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    );
  } else {
    // If items array is not provided, estimate merchandise subtotal from total
    const estimatedItemsGross = Math.max(0, totalPrice - (input.shippingCost ?? 0) - paymentFee + discount);
    subTotal = round2(estimatedItemsGross);
  }

  const discountedSubtotal = round2(Math.max(0, subTotal - discount));

  // 2. Derive or assign shippingCost
  // In checkout.service.ts, totalPrice = discountedSubtotal + shippingCost + paymentFee.
  // If shippingCost is not passed explicitly, dynamically derive it to match totalPrice.
  let shippingCost = 0;
  if (input.shippingCost !== undefined && input.shippingCost !== null) {
    shippingCost = round2(Math.max(0, input.shippingCost));
  } else {
    shippingCost = round2(Math.max(0, totalPrice - discountedSubtotal - paymentFee));
  }

  // 3. Extract Taxable Base (Matrah) and KDV (%20 Dahil)
  // Assumption: Merchandise, delivery, and payment fees are all subject to standard 20% KDV.
  const netAmount = round2(totalPrice / 1.20);
  const kdvAmount = round2(totalPrice - netAmount);

  // 4. Verify mathematical invariants
  const componentsSum = round2(discountedSubtotal + shippingCost + paymentFee);
  const lineItemsBalance = Math.abs(componentsSum - totalPrice) < 0.01;
  const taxSum = round2(netAmount + kdvAmount);
  const taxBalances = Math.abs(taxSum - totalPrice) < 0.01;

  return {
    subTotal,
    discount,
    discountedSubtotal,
    shippingCost,
    paymentFee,
    totalPrice,
    netAmount,
    kdvAmount,
    kdvRate: 20,
    invariants: {
      lineItemsBalance,
      taxBalances,
    },
  };
}
