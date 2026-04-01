import { NextResponse } from "next/server";
import { getPolymarketSnapshot } from "@/lib/polymarket";

export const dynamic = "force-dynamic";

export async function GET() {
  const snapshot = await getPolymarketSnapshot();
  return NextResponse.json(snapshot);
}
