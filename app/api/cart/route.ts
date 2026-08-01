import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

interface IncomingCartItem {
  id: string;
  variantId?: string | null;
  quantity: number;
}

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: { images: true }
            },
            variant: true
          }
        }
      }
    });

    if (!cart) {
      return NextResponse.json({ items: [] });
    }

    const formattedItems = cart.items
      .filter((item) => item.product && item.product.isActive)
      .map((item) => {
        const stock = item.variant ? item.variant.stock : item.product.stock;
        const price = item.variant ? (item.variant.discountedPrice ?? item.variant.price ?? item.product.price) : item.product.price;
        const imageUrls = item.product.images.map((img) => img.imageUrl);
        
        if (imageUrls.length === 0 && item.product.imageUrl) {
          imageUrls.push(item.product.imageUrl);
        }

        return {
          cartItemId: item.variantId ? `${item.product.id}-${item.variantId}` : item.product.id,
          id: item.product.id,
          name: item.variant?.combination ? `${item.product.name} (${item.variant.combination})` : item.product.name,
          price,
          imageUrls,
          quantity: Math.max(1, Math.min(item.quantity, stock > 0 ? stock : 1)),
          variantId: item.variantId || undefined,
          maxStock: stock,
        };
      });

    return NextResponse.json({ items: formattedItems });
  } catch (error) {
    console.error("Cart GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { items } = body as { items: IncomingCartItem[] };

    if (!Array.isArray(items)) {
      return NextResponse.json({ error: "Invalid payload format" }, { status: 400 });
    }

    // 1. Ürün ID'lerini topla ve veritabanından doğrula
    const productIds = Array.from(new Set(items.map((i) => i?.id).filter((id): id is string => typeof id === "string" && id.length > 0)));

    if (productIds.length === 0 && items.length > 0) {
      return NextResponse.json({ error: "Geçersiz ürün kimlikleri" }, { status: 400 });
    }

    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
      select: {
        id: true,
        stock: true,
        variants: {
          select: { id: true, stock: true, isActive: true }
        }
      }
    });

    const productMap = new Map(dbProducts.map((p) => [p.id, p]));

    // 2. Sepet satırlarını filtrele, temizle ve birleştir (deduplicate)
    const sanitizedMap = new Map<string, { productId: string; variantId: string | null; quantity: number }>();

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

    const sanitizedItems = Array.from(sanitizedMap.values());

    // 3. Upsert Cart
    const cart = await prisma.cart.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });

    // 4. Silme ve Yeniden Oluşturma İşlemini Güvenli Transaction İçinde Yürüt
    await prisma.$transaction([
      prisma.cartItem.deleteMany({
        where: { cartId: cart.id }
      }),
      ...(sanitizedItems.length > 0
        ? [
            prisma.cartItem.createMany({
              data: sanitizedItems.map((item) => ({
                cartId: cart.id,
                productId: item.productId,
                variantId: item.variantId,
                quantity: item.quantity,
              }))
            })
          ]
        : [])
    ]);

    return NextResponse.json({ success: true, count: sanitizedItems.length });
  } catch (error) {
    console.error("Cart POST Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
