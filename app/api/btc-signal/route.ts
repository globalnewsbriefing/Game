import { NextResponse } from "next/server";
import { getBtcSignal } from "@/lib/kalshi-btc";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const signal = await getBtcSignal();
    return NextResponse.json(signal);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to build BTC signal.",
      },
      { status: 502 },
    );
  }
}
