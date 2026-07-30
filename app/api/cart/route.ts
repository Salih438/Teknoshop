import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

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

    const formattedItems = cart.items.map(item => {
      const stock = item.variant ? item.variant.stock : item.product.stock;
      const price = item.variant?.price || item.product.price;
      const imageUrls = item.product.images.map(img => img.imageUrl);
      
      // Fallback to main product image if no gallery images
      if (imageUrls.length === 0 && item.product.imageUrl) {
        imageUrls.push(item.product.imageUrl);
      }

      return {
        cartItemId: item.variantId ? `${item.product.id}-${item.variantId}` : item.product.id,
        id: item.product.id,
        name: item.product.name,
        price,
        imageUrls,
        quantity: item.quantity,
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
    const { items } = body as { items: any[] };

    if (!Array.isArray(items)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Upsert Cart
    const cart = await prisma.cart.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });

    // Run delete and create in a transaction
    await prisma.$transaction([
      prisma.cartItem.deleteMany({
        where: { cartId: cart.id }
      }),
      prisma.cartItem.createMany({
        data: items.map(item => ({
          cartId: cart.id,
          productId: item.id,
          variantId: item.variantId || null,
          quantity: item.quantity,
        }))
      })
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cart POST Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
