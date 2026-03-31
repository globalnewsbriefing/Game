import { NextResponse } from "next/server";
import { getPolymarketWorkspace } from "@/lib/polymarket";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get("wallet") ?? undefined;
  const workspace = await getPolymarketWorkspace(wallet);
  return NextResponse.json(workspace);
}
