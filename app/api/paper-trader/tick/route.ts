import { NextResponse } from "next/server";
import { runPaperTraderTick } from "@/lib/paper-trader";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  try {
    const snapshot = await runPaperTraderTick();
    return NextResponse.json(snapshot);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to run paper trader tick." },
      { status: 502 },
    );
  }
}
