import { NextResponse } from "next/server";
import { getPolymarketWorkspace } from "@/lib/polymarket";

export const dynamic = "force-dynamic";

export async function GET() {
  const workspace = getPolymarketWorkspace();
  return NextResponse.json(workspace);
}
