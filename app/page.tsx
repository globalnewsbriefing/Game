import {
  getPolymarketWorkspace,
  type AuthenticatedWorkflow,
  type CommandReferenceSection,
  type LeaderboardEntry,
  type LiveEvent,
  type LiveMarket,
  type MarketBookSnapshot,
  type PromptRecipe,
  type WalletPosition,
} from "@/lib/polymarket";
import Link from "next/link";

export const dynamic = "force-dynamic";

function formatGeneratedAt(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(value));
}

function formatCompactNumber(value: number | null) {
  if (value === null || !Number.isFinite(value)) {
    return "N/A";
  }

  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: value >= 100 ? 0 : 1,
  }).format(value);
}

function formatCurrency(value: number | null) {
  if (value === null || !Number.isFinite(value)) {
    return "N/A";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 1000 ? 0 : 2,
  }).format(value);
}

function formatPercentFromUnit(value: number | null) {
  if (value === null || !Number.isFinite(value)) {
    return "N/A";
  }

  return `${(value * 100).toFixed(1)}%`;
}

function formatDate(value: string) {
  if (!value) {
    return "Open-ended";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function LeaderboardCard({ entry }: { entry: LeaderboardEntry }) {
  return (
    <article className="data-card">
      <div className="data-card__header">
        <div>
          <p className="eyebrow">Rank #{entry.rank}</p>
          <h3>{entry.userName}</h3>
        </div>
        <span className="status-pill">Live leaderboard</span>
      </div>
      <div className="metric-grid">
        <div>
          <span>PnL</span>
          <strong>{formatCurrency(entry.pnl)}</strong>
        </div>
        <div>
          <span>Volume</span>
          <strong>{formatCurrency(entry.volume)}</strong>
        </div>
      </div>
      <code>{entry.wallet}</code>
    </article>
  );
}

function MarketCard({ market }: { market: LiveMarket }) {
  return (
    <article className="data-card">
      <div className="data-card__header">
        <div>
          <p className="eyebrow">{market.eventTitle}</p>
          <h3>{market.question}</h3>
        </div>
        <span className="status-pill">Live market</span>
      </div>
      <p className="section-copy">
        Volume {formatCurrency(market.volume)} · Liquidity {formatCurrency(market.liquidity)} ·
        Ends {formatDate(market.endDate)}
      </p>
      <div className="metric-grid">
        <div>
          <span>Last trade</span>
          <strong>{formatPercentFromUnit(market.lastTradePrice)}</strong>
        </div>
        <div>
          <span>Best bid</span>
          <strong>{formatPercentFromUnit(market.bestBid)}</strong>
        </div>
        <div>
          <span>Best ask</span>
          <strong>{formatPercentFromUnit(market.bestAsk)}</strong>
        </div>
        <div>
          <span>24h move</span>
          <strong>{formatPercentFromUnit(market.oneDayPriceChange)}</strong>
        </div>
      </div>
      <div className="chip-row">
        {market.outcomes.map((outcome) => (
          <span key={`${market.id}-${outcome.label}`} className="chip">
            {outcome.label}: {formatPercentFromUnit(outcome.price)}
          </span>
        ))}
      </div>
      <code>{market.slug}</code>
    </article>
  );
}

function EventCard({ event }: { event: LiveEvent }) {
  return (
    <article className="data-card">
      <div className="data-card__header">
        <div>
          <p className="eyebrow">Politics event</p>
          <h3>{event.title}</h3>
        </div>
        <span className="status-pill">Live event</span>
      </div>
      <div className="metric-grid">
        <div>
          <span>Volume</span>
          <strong>{formatCurrency(event.volume)}</strong>
        </div>
        <div>
          <span>Liquidity</span>
          <strong>{formatCurrency(event.liquidity)}</strong>
        </div>
        <div>
          <span>Open interest</span>
          <strong>{formatCurrency(event.openInterest)}</strong>
        </div>
        <div>
          <span>Ends</span>
          <strong>{formatDate(event.endDate)}</strong>
        </div>
      </div>
      <div className="chip-row">
        {event.tags.slice(0, 5).map((tag) => (
          <span key={`${event.id}-${tag}`} className="chip">
            {tag}
          </span>
        ))}
      </div>
      <code>{event.slug}</code>
    </article>
  );
}

function PromptCard({
  recipe,
}: {
  recipe: PromptRecipe;
}) {
  return (
    <article className="prompt-card">
      <p className="eyebrow">Prompt recipe</p>
      <h3>{recipe.title}</h3>
      <p className="section-copy">{recipe.goal}</p>
      <blockquote>{recipe.prompt}</blockquote>
    </article>
  );
}

function WorkflowCard({ workflow }: { workflow: AuthenticatedWorkflow }) {
  return (
    <article className="workflow-card">
      <h3>{workflow.title}</h3>
      <p className="section-copy">{workflow.summary}</p>
      <div className="workflow-steps">
        {workflow.commands.map((command) => (
          <code key={command}>{command}</code>
        ))}
      </div>
    </article>
  );
}

function CommandReferenceCard({ section }: { section: CommandReferenceSection }) {
  return (
    <article className="workflow-card">
      <div className="data-card__header">
        <div>
          <p className="eyebrow">CLI reference</p>
          <h3>{section.title}</h3>
        </div>
        <span className="status-pill">{section.authLabel}</span>
      </div>
      <p className="section-copy">{section.summary}</p>
      <div className="workflow-steps">
        {section.commands.map((command) => (
          <code key={command}>{command}</code>
        ))}
      </div>
    </article>
  );
}

function WalletPositionCard({ position }: { position: WalletPosition }) {
  return (
    <article className="data-card">
      <div className="data-card__header">
        <div>
          <p className="eyebrow">{position.outcome || "Position"}</p>
          <h3>{position.title}</h3>
        </div>
        <span className={`wallet-pill${position.redeemable || position.mergeable ? " wallet-pill--required" : ""}`}>
          {position.redeemable ? "Redeemable" : position.mergeable ? "Mergeable" : "Open"}
        </span>
      </div>
      <div className="metric-grid">
        <div>
          <span>Size</span>
          <strong>{formatCompactNumber(position.size)}</strong>
        </div>
        <div>
          <span>Average price</span>
          <strong>{formatPercentFromUnit(position.avgPrice)}</strong>
        </div>
        <div>
          <span>Current value</span>
          <strong>{formatCurrency(position.currentValue)}</strong>
        </div>
        <div>
          <span>Cash PnL</span>
          <strong>{formatCurrency(position.cashPnl)}</strong>
        </div>
      </div>
      <p className="section-copy">Ends {formatDate(position.endDate)}</p>
      <code>{position.slug}</code>
    </article>
  );
}

function BookCard({ snapshot }: { snapshot: MarketBookSnapshot | null }) {
  if (!snapshot) {
    return (
      <article className="info-card">
        <h3>Order-book snapshot unavailable</h3>
        <p className="section-copy">
          No CLOB snapshot was available for the current top market.
        </p>
      </article>
    );
  }

  return (
    <article className="info-card info-card--wide">
      <p className="eyebrow">Live CLOB snapshot</p>
      <h3>{snapshot.question}</h3>
      <div className="metric-grid">
        <div>
          <span>Midpoint</span>
          <strong>{formatPercentFromUnit(snapshot.midpoint)}</strong>
        </div>
        <div>
          <span>Spread</span>
          <strong>{formatPercentFromUnit(snapshot.spread)}</strong>
        </div>
        <div>
          <span>Last trade</span>
          <strong>{formatPercentFromUnit(snapshot.lastTradePrice)}</strong>
        </div>
      </div>
      <div className="book-grid">
        <div>
          <p className="eyebrow">Top bids</p>
          {snapshot.topBids.map((level, index) => (
            <code key={`bid-${index}`}>
              {formatPercentFromUnit(level.price)} · {formatCompactNumber(level.size)}
            </code>
          ))}
        </div>
        <div>
          <p className="eyebrow">Top asks</p>
          {snapshot.topAsks.map((level, index) => (
            <code key={`ask-${index}`}>
              {formatPercentFromUnit(level.price)} · {formatCompactNumber(level.size)}
            </code>
          ))}
        </div>
      </div>
      <code>{snapshot.tokenId ?? snapshot.slug}</code>
    </article>
  );
}

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const walletValue = resolvedSearchParams.wallet;
  const wallet = Array.isArray(walletValue) ? walletValue[0] : walletValue;
  const workspace = await getPolymarketWorkspace(wallet);

  return (
    <main className="page-shell">
      <section className="hero">
        <div className="hero__content">
          <p className="eyebrow">Polymarket live</p>
          <h1>Live leaderboard, markets, book data, and public wallet positions in one workspace.</h1>
          <p className="hero__lede">{workspace.overview}</p>
          <div className="hero__stats">
            <div>
              <span>Leaderboard entries</span>
              <strong>{workspace.stats.leaderboardEntries}</strong>
            </div>
            <div>
              <span>Featured markets</span>
              <strong>{workspace.stats.featuredMarkets}</strong>
            </div>
            <div>
              <span>Politics events</span>
              <strong>{workspace.stats.politicsEvents}</strong>
            </div>
            <div>
              <span>Wallet positions</span>
              <strong>{workspace.stats.walletPositions}</strong>
            </div>
            <div>
              <span>CLI sections</span>
              <strong>{workspace.stats.commandReferenceSections}</strong>
            </div>
            <div>
              <span>Updated live</span>
              <strong>{formatGeneratedAt(workspace.generatedAt)}</strong>
            </div>
          </div>
          <div className="hero__links">
            <a className="primary-link" href={workspace.sourceUrl} target="_blank" rel="noreferrer">
              Open upstream CLI
            </a>
            <a
              className="secondary-link"
              href={workspace.walletView.activeWallet ? `/api/polymarket?wallet=${workspace.walletView.activeWallet}` : "/api/polymarket"}
              target="_blank"
              rel="noreferrer"
            >
              Open JSON API
            </a>
          </div>
        </div>
        <div className="hero__panel">
          <p className="eyebrow">Live data mode</p>
          <h2>Public APIs are connected</h2>
          <p className="section-copy">{workspace.warning}</p>
          <div className="wallet-form">
            <h3>Public wallet lookup</h3>
            <p className="section-copy">
              Try a public wallet with <code>?wallet=0x...</code>. Current source:
              {" "}
              {workspace.walletView.sourceLabel}
            </p>
            <p className="section-copy">
              If the wallet is invalid, the page falls back to the current top leaderboard wallet so
              the public portfolio section always stays populated.
            </p>
            <code>
              {workspace.walletView.activeWallet
                ? `/?wallet=${workspace.walletView.activeWallet}`
                : "/?wallet=0xYOUR_WALLET"}
            </code>
            {workspace.walletView.error ? <p className="error-copy">{workspace.walletView.error}</p> : null}
            <Link className="secondary-link" href={workspace.walletView.activeWallet ? `/?wallet=${workspace.walletView.activeWallet}` : "/"}>
              Reload wallet view
            </Link>
          </div>
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Leaderboard</p>
            <h2>Top monthly PnL traders</h2>
          </div>
          <p>These rankings come live from Polymarket&apos;s public Data API and can seed wallet-level investigation.</p>
        </div>
        <div className="data-grid data-grid--three">
          {workspace.leaderboards.monthlyPnl.map((entry) => (
            <LeaderboardCard key={entry.wallet} entry={entry} />
          ))}
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Markets</p>
            <h2>Highest-volume active markets</h2>
          </div>
          <p>Live market cards combine Gamma metadata with real price and spread fields already exposed by Polymarket.</p>
        </div>
        <div className="data-grid data-grid--two">
          {workspace.featuredMarkets.map((market) => (
            <MarketCard key={market.id} market={market} />
          ))}
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Politics events</p>
            <h2>Live politics event scan</h2>
          </div>
          <p>These event cards are pulled live from the Gamma API using the politics tag and ranked by current volume.</p>
        </div>
        <div className="data-grid data-grid--two">
          {workspace.politicsEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Order book</p>
            <h2>Live CLOB snapshot for the top market</h2>
          </div>
          <p>Midpoint, spread, and top-of-book bids and asks come from Polymarket&apos;s public CLOB endpoints.</p>
        </div>
        <div className="workflow-grid">
          <BookCard snapshot={workspace.bookSnapshot} />
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Public wallet view</p>
            <h2>Live positions and value</h2>
          </div>
          <p>Use a public wallet address to inspect visible positions and current total value without authenticated access.</p>
        </div>
        <div className="wallet-summary">
          <article className="info-card">
            <h3>Wallet source</h3>
            <p className="section-copy">{workspace.walletView.sourceLabel}</p>
            <code>{workspace.walletView.activeWallet ?? "No wallet selected"}</code>
            <div className="metric-grid">
              <div>
                <span>Total value</span>
                <strong>{formatCurrency(workspace.walletView.totalValue)}</strong>
              </div>
              <div>
                <span>Positions</span>
                <strong>{workspace.walletView.positions.length}</strong>
              </div>
            </div>
          </article>
        </div>
        <div className="data-grid data-grid--two">
          {workspace.walletView.positions.map((position) => (
            <WalletPositionCard key={`${position.conditionId}-${position.outcome}`} position={position} />
          ))}
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Kalshi-style prompts</p>
            <h2>Prompt patterns for the live data mode</h2>
          </div>
          <p>These prompts now map onto the live leaderboard, market, order-book, and public wallet sections shown above.</p>
        </div>
        <div className="prompt-grid">
          {workspace.promptRecipes.map((recipe) => (
            <PromptCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Authenticated actions</p>
            <h2>What still runs through the CLI</h2>
          </div>
          <p>Trading, private balances/orders, and onchain writes stay explicit and terminal-first because they require your own wallet and approvals.</p>
        </div>
        <div className="workflow-grid">
          {workspace.authenticatedWorkflows.map((workflow) => (
            <WorkflowCard key={workflow.id} workflow={workflow} />
          ))}
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">CLI coverage</p>
            <h2>Additional Polymarket command reference</h2>
          </div>
          <p>These grouped commands complement the live dashboard when you want to keep digging from the terminal or pipe JSON into scripts.</p>
        </div>
        <div className="workflow-grid">
          {workspace.commandReference.map((section) => (
            <CommandReferenceCard key={section.id} section={section} />
          ))}
        </div>
      </section>
    </main>
  );
}
