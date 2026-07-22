import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { items } = await request.json();
    
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ items: [] });
    }

    const validatedItems = await Promise.all(
      items.map(async (item: { id: string; variantId?: string; cartItemId: string }) => {
        const product = await prisma.product.findUnique({
          where: { id: item.id },
          // Eğer ileride variant modeli eklenirse burada include: { variants: true } yapılabilir.
          // Şu anki şemada Product modelinde variants tablosu var mı? (Şemayı incelemiştik, variant yok gibi görünüyordu ama güvenlik amaçlı varsayılan fallback bırakıyoruz.)
        });

        if (!product || !product.isActive) {
          return { cartItemId: item.cartItemId, isActive: false, stock: 0, price: 0 };
        }

        // Mevcut şemada basit stok yönetimi baz alınıyor.
        return {
          cartItemId: item.cartItemId,
          isActive: true,
          stock: product.stock,
          price: product.price,
        };
      })
    );

    return NextResponse.json({ success: true, items: validatedItems });
  } catch (error) {
    console.error("Cart validation error:", error);
    return NextResponse.json({ error: "Validation failed" }, { status: 500 });
  }
}
