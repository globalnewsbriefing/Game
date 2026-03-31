import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { getNewsBriefing } from "../lib/news";

async function main() {
  const briefing = await getNewsBriefing();
  const outputDir = path.join(process.cwd(), "app", "generated");
  const outputPath = path.join(outputDir, "briefing.json");

  mkdirSync(outputDir, { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(briefing, null, 2)}\n`, "utf8");
  process.stdout.write(`Generated ${outputPath}\n`);
}

main().catch((error) => {
  process.stderr.write(
    `${error instanceof Error ? error.stack ?? error.message : String(error)}\n`,
  );
  process.exit(1);
});
