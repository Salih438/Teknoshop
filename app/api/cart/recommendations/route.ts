
import { NextResponse } from "next/server";
import { getCartPopularProducts } from "@/lib/recommendation-engine";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { productIds } = body;

    const cartProductIds = Array.isArray(productIds) ? productIds : [];
    const recommendations = await getCartPopularProducts(cartProductIds, 4);

    return NextResponse.json({ recommendations }, { status: 200 });
  } catch (error) {
    console.error("Cart Recommendations API Error:", error);
    return NextResponse.json({ error: "Önerilen ürünler yüklenemedi." }, { status: 500 });
  }
}

