import briefingData from "@/app/generated/briefing.json";
import { BriefingClient } from "@/app/briefing-client";
import { type NewsBriefing } from "@/lib/news";

export default function HomePage() {
  return <BriefingClient briefing={briefingData as NewsBriefing} />;
}
