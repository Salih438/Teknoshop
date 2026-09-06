/**
 * Unified product stock calculation utility for Teknoshop.
 * 
 * Rules:
 * 1. If a product has variants (array of length > 0), the aggregate effective stock
 *    is the SUM of all variant stocks.
 * 2. If a product has no variants (or empty array), effective stock is product.stock directly.
 */

export interface StockableVariant {
  stock: number | null | undefined;
}

export interface StockableProduct {
  stock?: number | null;
  variants?: StockableVariant[] | null;
}

/**
 * Computes the total available stock for a product across all variants or simple stock.
 */
export function getEffectiveStock(product: StockableProduct | null | undefined): number {
  if (!product) return 0;

  if (product.variants && product.variants.length > 0) {
    return product.variants.reduce((total, variant) => {
      const vStock = typeof variant.stock === "number" ? variant.stock : 0;
      return total + Math.max(0, vStock);
    }, 0);
  }

  return typeof product.stock === "number" ? Math.max(0, product.stock) : 0;
}

/**
 * Returns true if the product has one or more defined variants.
 */
export function hasVariants(product: StockableProduct | null | undefined): boolean {
  return Boolean(product?.variants && product.variants.length > 0);
}
