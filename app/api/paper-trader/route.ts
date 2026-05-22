import { NextResponse } from "next/server";
import { getPaperTraderSnapshot } from "@/lib/paper-trader";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const snapshot = await getPaperTraderSnapshot();
    return NextResponse.json(snapshot);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load paper trader." },
      { status: 502 },
    );
  }
}
