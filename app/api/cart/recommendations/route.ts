
import { NextResponse } from "next/server";
import { getCartPopularProducts } from "@/lib/recommendation-engine";
import { getClientIdentifier, checkRateLimit, rateLimitResponse } from "@/lib/rate-limiter";

export async function POST(request: Request) {
  try {
    const identifier = getClientIdentifier(request);
    const rateLimit = await checkRateLimit(identifier, { limit: 30, windowSeconds: 60 });
    if (!rateLimit.success) {
      return rateLimitResponse(rateLimit, "Çok fazla öneri isteğinde bulundunuz. Lütfen 1 dakika bekleyip tekrar deneyin.");
    }

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

