const baseUrl = process.env.PAPER_TRADER_BASE_URL ?? "http://localhost:3000";
const intervalMs = Number(process.env.PAPER_TRADER_INTERVAL_MS ?? 15000);

async function tick() {
  const response = await fetch(`${baseUrl}/api/paper-trader/tick`, { method: "POST" });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error ?? `Paper trader tick failed with ${response.status}`);
  }

  const position = payload.openPosition ? `${payload.openPosition.side.toUpperCase()} ${payload.openPosition.contracts} contracts` : "flat";
  console.log(
    `[${new Date().toISOString()}] equity=$${payload.equity.toFixed(4)} cash=$${payload.cash.toFixed(4)} position=${position} action=${payload.lastAction}`,
  );
}

async function loop() {
  console.log(`Paper trader running against ${baseUrl} every ${intervalMs}ms. Keep the Next app running separately.`);

  while (true) {
    try {
      await tick();
    } catch (error) {
      console.error(`[${new Date().toISOString()}]`, error instanceof Error ? error.message : error);
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}

loop();
