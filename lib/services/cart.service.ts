import { prisma } from "@/lib/prisma";

export interface IncomingCartItem {
  id: string;
  variantId?: string | null;
  quantity: number;
}

export class CartService {
  /**
   * Kullanıcının veritabanındaki sepetini getirir ve formatlar
   */
  static async getUserCart(userId: string) {
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: { images: true },
            },
            variant: true,
          },
        },
      },
    });

    if (!cart) {
      return { items: [] };
    }

    const formattedItems = cart.items
      .filter((item) => item.product && item.product.isActive)
      .map((item) => {
        const stock = item.variant ? item.variant.stock : item.product.stock;
        const price = item.variant
          ? item.variant.discountedPrice ?? item.variant.price ?? item.product.price
          : item.product.price;
        const imageUrls = item.product.images.map((img) => img.imageUrl);

        if (imageUrls.length === 0 && item.product.imageUrl) {
          imageUrls.push(item.product.imageUrl);
        }

        return {
          cartItemId: item.variantId ? `${item.product.id}-${item.variantId}` : item.product.id,
          id: item.product.id,
          name: item.variant?.combination
            ? `${item.product.name} (${item.variant.combination})`
            : item.product.name,
          price,
          imageUrls,
          quantity: Math.max(1, Math.min(item.quantity, stock > 0 ? stock : 1)),
          variantId: item.variantId || undefined,
          maxStock: stock,
        };
      });

    return { items: formattedItems };
  }

  /**
   * İstemci sepetini doğrular ve veritabanı sepeti ile senkronize eder (ACID Transaction)
   */
  static async syncUserCart(userId: string, items: IncomingCartItem[]) {
    if (!Array.isArray(items)) {
      throw new Error("Invalid payload format");
    }

    const productIds = Array.from(
      new Set(
        items
          .map((i) => i?.id)
          .filter((id): id is string => typeof id === "string" && id.length > 0)
      )
    );

    if (productIds.length === 0 && items.length > 0) {
      throw new Error("Geçersiz ürün kimlikleri");
    }

    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
      select: {
        id: true,
        stock: true,
        variants: {
          select: { id: true, stock: true, isActive: true },
        },
      },
    });

    const productMap = new Map(dbProducts.map((p) => [p.id, p]));
    const sanitizedMap = new Map<
      string,
      { productId: string; variantId: string | null; quantity: number }
    >();

    for (const item of items) {
      if (!item || typeof item.id !== "string" || !item.id) continue;

      const product = productMap.get(item.id);
      if (!product) continue;

      let maxStock = product.stock;
      let variantId: string | null = null;

      if (item.variantId && typeof item.variantId === "string") {
        const variant = product.variants.find((v) => v.id === item.variantId);
        if (!variant || !variant.isActive) continue;
        maxStock = variant.stock;
        variantId = variant.id;
      }

      if (maxStock <= 0) continue;

      const parsedQuantity = Math.floor(Number(item.quantity) || 1);
      if (parsedQuantity <= 0) continue;

      const clampedQuantity = Math.min(parsedQuantity, Math.min(maxStock, 10));
      const key = variantId ? `${product.id}-${variantId}` : product.id;

      const existing = sanitizedMap.get(key);
      if (existing) {
        existing.quantity = Math.min(existing.quantity + clampedQuantity, Math.min(maxStock, 10));
      } else {
        sanitizedMap.set(key, {
          productId: product.id,
          variantId,
          quantity: clampedQuantity,
        });
      }
    }

    const validItems = Array.from(sanitizedMap.values());

    return prisma.$transaction(async (tx) => {
      let cart = await tx.cart.findUnique({
        where: { userId },
      });

      if (!cart) {
        cart = await tx.cart.create({
          data: { userId },
        });
      }

      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      if (validItems.length > 0) {
        await tx.cartItem.createMany({
          data: validItems.map((item) => ({
            cartId: cart.id,
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
          })),
        });
      }

      return { success: true, count: validItems.length };
    });
  }
}
