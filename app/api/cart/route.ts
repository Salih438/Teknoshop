import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { CartService, IncomingCartItem } from "@/lib/services/cart.service";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    const body = await req.json();
    const { items } = body as { items: IncomingCartItem[] };

    const result = await CartService.syncUserCart(userId, items);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Cart POST Error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal Server Error" },
      { status: 400 }
    );
  }
}
