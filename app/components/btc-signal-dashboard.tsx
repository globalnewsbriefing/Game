"use client";

import { useEffect, useMemo, useState } from "react";

type SignalSide = "up" | "down" | "pass";
type SignalStrength = "high" | "medium" | "low" | "none";

type BtcSignal = {
  generatedAt: string;
  market: {
    ticker: string;
    eventTicker: string;
    title: string;
    targetPrice: number;
    openTime: string;
    closeTime: string;
    secondsToClose: number;
    rulesPrimary: string;
    rulesSecondary: string;
  };
  spot: {
    price: number;
    source: string;
  };
  orderbook: {
    yesBidCents: number;
    yesAskCents: number;
    noBidCents: number;
    noAskCents: number;
    lastCents: number;
    spreadCents: number;
    volume: number;
    openInterest: number;
  };
  model: {
    fairUpProbability: number;
    fairUpCents: number;
    fairDownCents: number;
    yesEdgeCents: number;
    noEdgeCents: number;
    distanceFromTarget: number;
    oneMinuteMove: number;
    fiveMinuteMove: number;
    estimatedMoveToClose: number;
  };
  recommendation: {
    side: SignalSide;
    label: string;
    strength: SignalStrength;
    edgeCents: number;
    maxEntryCents: number | null;
    stakeGuidance: string;
    reasons: string[];
    warnings: string[];
  };
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value);
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  }).format(new Date(value));
}

function formatCountdown(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

function formatSignedDollars(value: number) {
  const sign = value >= 0 ? "+" : "-";
  return `${sign}${formatCurrency(Math.abs(value))}`;
}

function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  );
}

function RecommendationBadge({ side }: { side: SignalSide }) {
  return <div className={`recommendation-badge recommendation-badge--${side}`}>{side.toUpperCase()}</div>;
}

export function BtcSignalDashboard() {
  const [signal, setSignal] = useState<BtcSignal | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadSignal() {
      try {
        const response = await fetch("/api/btc-signal", { cache: "no-store" });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error ?? "Unable to load BTC signal.");
        }

        if (isMounted) {
          setSignal(payload);
          setError(null);
        }
      } catch (caught) {
        if (isMounted) {
          setError(caught instanceof Error ? caught.message : "Unable to load BTC signal.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadSignal();
    const interval = window.setInterval(loadSignal, 5000);

    return () => {
      isMounted = false;
      window.clearInterval(interval);
    };
  }, []);

  const sideAccent = useMemo(() => signal?.recommendation.side ?? "pass", [signal]);

  return (
    <main className="page-shell">
      <section className={`hero hero--${sideAccent}`}>
        <div className="hero__content">
          <p className="eyebrow">Kalshi BTC 15-minute signal</p>
          <h1>Live Up/Down edge board for Bitcoin contracts.</h1>
          <p className="hero__lede">
            This dashboard compares the active Kalshi KXBTC15M market against BTC spot, short-term
            momentum, realized minute volatility, and a strict 5c edge filter.
          </p>
          <div className="hero__actions">
            <a href="https://kalshi.com/markets/kxbtc15m/bitcoin-price-up-down" target="_blank" rel="noreferrer">
              Open Kalshi market
            </a>
            <span>Refreshes every 5 seconds</span>
          </div>
        </div>

        <aside className="decision-panel">
          {isLoading ? (
            <div className="loading-state">Loading live BTC signal...</div>
          ) : error ? (
            <div className="error-state">{error}</div>
          ) : signal ? (
            <>
              <RecommendationBadge side={signal.recommendation.side} />
              <p className="eyebrow">Best action now</p>
              <h2>{signal.recommendation.label}</h2>
              <div className="decision-panel__meta">
                <div>
                  <span>Strength</span>
                  <strong>{signal.recommendation.strength}</strong>
                </div>
                <div>
                  <span>Edge</span>
                  <strong>{signal.recommendation.edgeCents.toFixed(1)}c</strong>
                </div>
              </div>
              <p className="decision-panel__stake">{signal.recommendation.stakeGuidance}</p>
              <p className="decision-panel__entry">
                Max entry:{" "}
                <strong>
                  {signal.recommendation.maxEntryCents
                    ? `${signal.recommendation.maxEntryCents}c`
                    : "No entry"}
                </strong>
              </p>
            </>
          ) : null}
        </aside>
      </section>

      {signal ? (
        <>
          <section className="market-grid">
            <StatCard
              label="BTC spot"
              value={formatCurrency(signal.spot.price)}
              detail={signal.spot.source}
            />
            <StatCard
              label="Target"
              value={formatCurrency(signal.market.targetPrice)}
              detail={`${formatSignedDollars(signal.model.distanceFromTarget)} from target`}
            />
            <StatCard
              label="Time left"
              value={formatCountdown(signal.market.secondsToClose)}
              detail={`Closes ${formatTime(signal.market.closeTime)}`}
            />
            <StatCard
              label="Estimated move"
              value={formatCurrency(signal.model.estimatedMoveToClose)}
              detail="Volatility-adjusted move to close"
            />
          </section>

          <section className="section-block">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Market vs model</p>
                <h2>{signal.market.eventTicker}</h2>
              </div>
              <p>Last updated {formatTime(signal.generatedAt)}</p>
            </div>
            <div className="odds-grid">
              <article className="odds-card odds-card--up">
                <span>Buy Up</span>
                <strong>{signal.orderbook.yesAskCents.toFixed(1)}c</strong>
                <p>Fair {signal.model.fairUpCents.toFixed(1)}c · edge {signal.model.yesEdgeCents.toFixed(1)}c</p>
              </article>
              <article className="odds-card odds-card--down">
                <span>Buy Down</span>
                <strong>{signal.orderbook.noAskCents.toFixed(1)}c</strong>
                <p>Fair {signal.model.fairDownCents.toFixed(1)}c · edge {signal.model.noEdgeCents.toFixed(1)}c</p>
              </article>
              <article className="odds-card">
                <span>Flow context</span>
                <strong>{formatNumber(signal.orderbook.volume)}</strong>
                <p>Contracts volume · {formatNumber(signal.orderbook.openInterest)} open interest</p>
              </article>
            </div>
          </section>

          <section className="signal-grid">
            <article className="section-block">
              <div className="section-heading section-heading--stacked">
                <p className="eyebrow">Why this signal</p>
                <h2>Trade checklist</h2>
              </div>
              <ul className="insight-list">
                {signal.recommendation.reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            </article>

            <article className="section-block">
              <div className="section-heading section-heading--stacked">
                <p className="eyebrow">Risk controls</p>
                <h2>Do not skip these</h2>
              </div>
              <ul className="insight-list insight-list--warning">
                {signal.recommendation.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
                <li>Never martingale; stop for the session after two emotional entries.</li>
              </ul>
            </article>
          </section>

          <section className="contract-rules">
            <p className="eyebrow">Contract rule reminder</p>
            <p>{signal.market.rulesPrimary}</p>
            <p>{signal.market.rulesSecondary}</p>
          </section>
        </>
      ) : null}
    </main>
  );
}
