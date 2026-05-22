import { NextResponse } from "next/server";
import { resetPaperTrader } from "@/lib/paper-trader";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  try {
    const snapshot = await resetPaperTrader();
    return NextResponse.json(snapshot);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to reset paper trader." },
      { status: 502 },
    );
  }
}
