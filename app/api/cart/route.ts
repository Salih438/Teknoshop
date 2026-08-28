import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { CartService, IncomingCartItem } from "@/lib/services/cart.service";
import { getClientIdentifier, checkRateLimit, rateLimitResponse } from "@/lib/rate-limiter";

export async function GET(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const identifier = getClientIdentifier(request, userId);
    const rateLimit = await checkRateLimit(identifier, { limit: 60, windowSeconds: 60 });
    if (!rateLimit.success) {
      return rateLimitResponse(rateLimit);
    }

    const result = await CartService.getUserCart(userId);
    return NextResponse.json(result);
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

    const identifier = getClientIdentifier(req, userId);
    const rateLimit = await checkRateLimit(identifier, { limit: 30, windowSeconds: 60 });
    if (!rateLimit.success) {
      return rateLimitResponse(rateLimit);
    }

    const body = await req.json();
    const { items } = body as { items: IncomingCartItem[] };

    const result = await CartService.syncUserCart(userId, items);
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Cart POST Error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}
