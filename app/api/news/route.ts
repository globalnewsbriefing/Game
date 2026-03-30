import { NextResponse } from "next/server";
import { getNewsBriefing } from "@/lib/news";

export const dynamic = "force-dynamic";

export async function GET() {
  const briefing = await getNewsBriefing();
  return NextResponse.json(briefing);
}
