import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getClientIdentifier, checkRateLimit, rateLimitResponse } from "@/lib/rate-limiter";

interface CartValidateInputItem {
  id: string;
  variantId?: string;
  cartItemId: string;
}

export async function POST(request: Request) {
  try {
    const identifier = getClientIdentifier(request);
    const rateLimit = await checkRateLimit(identifier, { limit: 30, windowSeconds: 60 });
    if (!rateLimit.success) {
      return rateLimitResponse(rateLimit, "Çok fazla sepet doğrulama isteğinde bulundunuz. Lütfen 1 dakika bekleyip tekrar deneyin.");
    }

    const body = await request.json();
    const items = body?.items as CartValidateInputItem[];

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: true, items: [] });
    }

    const productIds = Array.from(new Set(items.map((i) => i.id).filter((id): id is string => typeof id === "string" && id.length > 0)));

    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: {
        variants: true,
      },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    const validatedItems = items.map((item) => {
      const product = productMap.get(item.id);

      if (!product || !product.isActive) {
        return { cartItemId: item.cartItemId, isActive: false, stock: 0, price: 0 };
      }

      if (item.variantId) {
        const variant = product.variants.find((v) => v.id === item.variantId);
        if (!variant || !variant.isActive) {
          return { cartItemId: item.cartItemId, isActive: false, stock: 0, price: 0 };
        }
        const effectivePrice = variant.discountedPrice ?? variant.price ?? product.price;
        return {
          cartItemId: item.cartItemId,
          isActive: true,
          stock: variant.stock,
          price: effectivePrice,
        };
      }

      return {
        cartItemId: item.cartItemId,
        isActive: true,
        stock: product.stock,
        price: product.price,
      };
    });

    return NextResponse.json({ success: true, items: validatedItems });
  } catch (error) {
    console.error("Cart validation error:", error);
    return NextResponse.json({ error: "Validation failed" }, { status: 500 });
  }
}
