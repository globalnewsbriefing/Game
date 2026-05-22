"use client";

import { useEffect, useMemo, useState } from "react";

type SignalSide = "up" | "down" | "pass";
type SignalStrength = "high" | "medium" | "low" | "none";
type PositionSide = Exclude<SignalSide, "pass">;

type ActiveBet = {
  side: PositionSide;
  entryCents: number;
  eventTicker: string;
  enteredAt: string;
  entrySpot: number;
};

type TradeRecord = {
  side: PositionSide;
  entryCents: number;
  exitCents: number;
  pnlCents: number;
  eventTicker: string;
  closedAt: string;
};

type CoachInstruction = {
  headline: string;
  action: string;
  detail: string;
  tone: SignalSide;
  bullets: string[];
  pnlCents: number | null;
  exitCents: number | null;
};

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

const BET_STORAGE_KEY = "kalshi-btc-active-bet";
const BANKROLL_STORAGE_KEY = "kalshi-btc-bankroll";
const TRADE_MEMORY_STORAGE_KEY = "kalshi-btc-trade-memory";

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

function formatCents(value: number) {
  return `${value.toFixed(1)}c`;
}

function sideLabel(side: PositionSide) {
  return side === "up" ? "Up" : "Down";
}

function getEntryCents(signal: BtcSignal, side: PositionSide) {
  return side === "up" ? signal.orderbook.yesAskCents : signal.orderbook.noAskCents;
}

function getExitCents(signal: BtcSignal, side: PositionSide) {
  return side === "up" ? signal.orderbook.yesBidCents : signal.orderbook.noBidCents;
}

function getSideEdge(signal: BtcSignal, side: PositionSide) {
  return side === "up" ? signal.model.yesEdgeCents : signal.model.noEdgeCents;
}

function getRiskFraction(strength: SignalStrength) {
  if (strength === "high") {
    return 0.01;
  }

  if (strength === "medium") {
    return 0.005;
  }

  if (strength === "low") {
    return 0.0025;
  }

  return 0;
}

function buildStakeAdvice(signal: BtcSignal, bankrollDollars: number, consecutiveLosses: number) {
  const side = signal.recommendation.side === "pass" ? null : signal.recommendation.side;
  const riskFraction = getRiskFraction(signal.recommendation.strength);

  if (consecutiveLosses >= 2) {
    return "Suggested bet: $0. Cooldown after recent losses; wait for a fresh high-confidence setup.";
  }

  if (!side || riskFraction === 0 || bankrollDollars <= 0) {
    return "Suggested bet: $0. Wait for a cleaner edge.";
  }

  const stakeDollars = Math.max(0, bankrollDollars * riskFraction);
  const entryDollars = getEntryCents(signal, side) / 100;
  const contracts = entryDollars > 0 ? stakeDollars / entryDollars : 0;

  return `Suggested bet: max ${formatCurrency(stakeDollars)} on ${sideLabel(side)} (~${contracts.toFixed(1)} contracts).`;
}

function getConsecutiveLosses(records: TradeRecord[]) {
  let losses = 0;

  for (const record of records.slice().reverse()) {
    if (record.pnlCents < 0) {
      losses += 1;
    } else {
      break;
    }
  }

  return losses;
}

function buildAddMoreAdvice(
  signal: BtcSignal,
  activeBet: ActiveBet | null,
  bankrollDollars: number,
  consecutiveLosses: number,
) {
  if (!activeBet) {
    return null;
  }

  const sameSideAsk = getEntryCents(signal, activeBet.side);
  const sameSideEdge = getSideEdge(signal, activeBet.side);
  const targetLineCrossed = hasCrossedTargetLine(signal, activeBet.side);
  const betterPrice = sameSideAsk <= activeBet.entryCents - 2;
  const enoughTime = signal.market.secondsToClose >= 180;

  if (consecutiveLosses >= 2) {
    return "Add more: No. Cooldown mode is active after recent losses.";
  }

  if (targetLineCrossed || !enoughTime) {
    return "Add more: No. Manage the exit; do not increase size late.";
  }

  if (betterPrice && sameSideEdge >= 12 && signal.recommendation.side === activeBet.side && bankrollDollars > 0) {
    const addDollars = bankrollDollars * 0.0025;
    const contracts = sameSideAsk > 0 ? addDollars / (sameSideAsk / 100) : 0;
    return `Add more: Allowed only tiny, max ${formatCurrency(addDollars)} (~${contracts.toFixed(1)} contracts), because price improved and edge still agrees.`;
  }

  return "Add more: No. Wait; only add when price improves and the same-side edge is very strong.";
}

function hasCrossedTargetLine(signal: BtcSignal, side: PositionSide) {
  return side === "up"
    ? signal.spot.price >= signal.market.targetPrice
    : signal.spot.price < signal.market.targetPrice;
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

function buildCoachInstruction(signal: BtcSignal, activeBet: ActiveBet | null): CoachInstruction {
  if (!activeBet) {
    const entrySide = signal.recommendation.side === "pass" ? null : signal.recommendation.side;
    const maxEntry = signal.recommendation.maxEntryCents;

    return {
      headline: signal.recommendation.label,
      action: entrySide ? `Enter ${sideLabel(entrySide)} only at ${maxEntry}c or better.` : "Wait. Do not enter yet.",
      detail: entrySide
        ? `After you buy ${sideLabel(entrySide)}, tap the matching button so the dashboard switches to hold/sell mode.`
        : "No side clears the edge filter, so the clean move is to wait for a better price.",
      tone: signal.recommendation.side,
      bullets: [
        `Current Up ask: ${formatCents(signal.orderbook.yesAskCents)}.`,
        `Current Down ask: ${formatCents(signal.orderbook.noAskCents)}.`,
        `Target is ${formatSignedDollars(signal.model.distanceFromTarget)} from BTC spot.`,
      ],
      pnlCents: null,
      exitCents: null,
    };
  }

  if (activeBet.eventTicker !== signal.market.eventTicker) {
    return {
      headline: "Mark settled",
      action: "This bet window is over. Clear it before the next entry.",
      detail: `Your tracked ${sideLabel(activeBet.side)} bet belongs to ${activeBet.eventTicker}; the live market is now ${signal.market.eventTicker}.`,
      tone: "pass",
      bullets: ["Record the result, clear the tracker, then wait for the next clean signal."],
      pnlCents: null,
      exitCents: null,
    };
  }

  const exitCents = getExitCents(signal, activeBet.side);
  const pnlCents = Math.round((exitCents - activeBet.entryCents) * 10) / 10;
  const heldEdge = getSideEdge(signal, activeBet.side);
  const oppositeSide: PositionSide = activeBet.side === "up" ? "down" : "up";
  const oppositeEdge = getSideEdge(signal, oppositeSide);
  const sameSideSignal = signal.recommendation.side === activeBet.side;
  const oppositeSignal = signal.recommendation.side === oppositeSide;
  const nearClose = signal.market.secondsToClose <= 45;
  const veryLate = signal.market.secondsToClose <= 75;
  const targetLineCrossed = hasCrossedTargetLine(signal, activeBet.side);
  const wrongSideGap = activeBet.side === "up"
    ? Math.max(0, signal.market.targetPrice - signal.spot.price)
    : Math.max(0, signal.spot.price - signal.market.targetPrice);
  const lateGapTooLarge = wrongSideGap > Math.max(8, signal.model.estimatedMoveToClose * 0.28);

  if (targetLineCrossed) {
    return {
      headline: "Sell now",
      action: "The target line crossed in your bet direction; sell now.",
      detail: `${sideLabel(activeBet.side)} has passed the ${formatCurrency(signal.market.targetPrice)} target line. Lock the planned exit unless you intentionally want extra risk.`,
      tone: activeBet.side,
      bullets: [
        `Current sell price: ${formatCents(exitCents)}.`,
        `Open P/L: ${pnlCents >= 0 ? "+" : ""}${formatCents(pnlCents)}.`,
        "After selling on Kalshi, tap I sold / bet is done so the next signal starts clean.",
      ],
      pnlCents,
      exitCents,
    };
  }

  if ((veryLate && wrongSideGap > 0) || (signal.market.secondsToClose <= 120 && lateGapTooLarge)) {
    return {
      headline: "Sell now",
      action: "Late window: sell now to avoid a full loss.",
      detail: `${sideLabel(activeBet.side)} is still $${wrongSideGap.toFixed(2)} away from crossing the target line with ${formatCountdown(signal.market.secondsToClose)} left. Take the partial exit instead of hoping for a last-second move.`,
      tone: "pass",
      bullets: [
        `Current sell price: ${formatCents(exitCents)}.`,
        `Open P/L: ${pnlCents >= 0 ? "+" : ""}${formatCents(pnlCents)}.`,
        "Late saves matter: a partial loss is better than letting a low-probability bet expire worthless.",
      ],
      pnlCents,
      exitCents,
    };
  }

  if (oppositeSignal && oppositeEdge >= 5) {
    return {
      headline: "Sell now",
      action: `Exit ${sideLabel(activeBet.side)} before considering ${sideLabel(oppositeSide)}.`,
      detail: `The live signal flipped against your position with ${formatCents(oppositeEdge)} opposite-side edge.`,
      tone: oppositeSide,
      bullets: [
        `Current sell price: ${formatCents(exitCents)}.`,
        `Open P/L: ${pnlCents >= 0 ? "+" : ""}${formatCents(pnlCents)}.`,
        "Do not flip into the next bet until this one is cleared.",
      ],
      pnlCents,
      exitCents,
    };
  }

  if (pnlCents >= 12 && !sameSideSignal) {
    return {
      headline: "Sell now",
      action: "Take the profit; the entry edge has faded.",
      detail: `You can currently sell ${sideLabel(activeBet.side)} for ${formatCents(exitCents)}, about ${formatCents(pnlCents)} above entry.`,
      tone: "pass",
      bullets: [
        "Profit is available while the model is no longer strongly adding to the same side.",
        "After selling, clear the tracker and wait for the next Up/Down command.",
      ],
      pnlCents,
      exitCents,
    };
  }

  if (pnlCents <= -10 && heldEdge < 2) {
    return {
      headline: "Sell now",
      action: "Cut the bet; the thesis is no longer clean.",
      detail: `The held side edge is only ${formatCents(heldEdge)} and the position is down ${formatCents(Math.abs(pnlCents))}.`,
      tone: "pass",
      bullets: [
        `Current sell price: ${formatCents(exitCents)}.`,
        "Clear the tracker after selling so the next signal starts fresh.",
      ],
      pnlCents,
      exitCents,
    };
  }

  return {
    headline: "Keep until target line",
    action: `Keep until BTC crosses ${formatCurrency(signal.market.targetPrice)} in the ${sideLabel(activeBet.side)} direction.`,
    detail: nearClose
      ? `There are ${formatCountdown(signal.market.secondsToClose)} left, but the target line has not crossed yet.`
      : `Current BTC is $${wrongSideGap.toFixed(2)} away from crossing the target line; sell when this panel changes to Sell now.`,
    tone: activeBet.side,
    bullets: [
      `Entry: ${formatCents(activeBet.entryCents)}. Current sell price: ${formatCents(exitCents)}.`,
      `Open P/L: ${pnlCents >= 0 ? "+" : ""}${formatCents(pnlCents)}.`,
      sameSideSignal
        ? `The live signal still agrees with your position with ${formatCents(heldEdge)} held-side edge.`
        : "Do not add size while waiting for the target-line exit.",
    ],
    pnlCents,
    exitCents,
  };
}

export function BtcSignalDashboard() {
  const [signal, setSignal] = useState<BtcSignal | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeBet, setActiveBet] = useState<ActiveBet | null>(null);
  const [bankrollInput, setBankrollInput] = useState("100");
  const [tradeMemory, setTradeMemory] = useState<TradeRecord[]>([]);

  useEffect(() => {
    const storedBet = window.localStorage.getItem(BET_STORAGE_KEY);
    const storedBankroll = window.localStorage.getItem(BANKROLL_STORAGE_KEY);
    const storedTradeMemory = window.localStorage.getItem(TRADE_MEMORY_STORAGE_KEY);

    if (storedBankroll) {
      setBankrollInput(storedBankroll);
    }

    if (storedTradeMemory) {
      try {
        setTradeMemory(JSON.parse(storedTradeMemory) as TradeRecord[]);
      } catch {
        window.localStorage.removeItem(TRADE_MEMORY_STORAGE_KEY);
      }
    }

    if (!storedBet) {
      return;
    }

    try {
      setActiveBet(JSON.parse(storedBet) as ActiveBet);
    } catch {
      window.localStorage.removeItem(BET_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (activeBet) {
      window.localStorage.setItem(BET_STORAGE_KEY, JSON.stringify(activeBet));
    } else {
      window.localStorage.removeItem(BET_STORAGE_KEY);
    }
  }, [activeBet]);

  useEffect(() => {
    window.localStorage.setItem(BANKROLL_STORAGE_KEY, bankrollInput);
  }, [bankrollInput]);

  useEffect(() => {
    window.localStorage.setItem(TRADE_MEMORY_STORAGE_KEY, JSON.stringify(tradeMemory.slice(-20)));
  }, [tradeMemory]);

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

  const coachInstruction = useMemo(
    () => (signal ? buildCoachInstruction(signal, activeBet) : null),
    [activeBet, signal],
  );
  const sideAccent = useMemo(
    () => activeBet?.side ?? coachInstruction?.tone ?? signal?.recommendation.side ?? "pass",
    [activeBet?.side, coachInstruction?.tone, signal?.recommendation.side],
  );
  const bankrollDollars = Number(bankrollInput);
  const normalizedBankroll = Number.isFinite(bankrollDollars) ? bankrollDollars : 0;
  const consecutiveLosses = getConsecutiveLosses(tradeMemory);
  const stakeAdvice = signal ? buildStakeAdvice(signal, normalizedBankroll, consecutiveLosses) : "";
  const addMoreAdvice = signal ? buildAddMoreAdvice(signal, activeBet, normalizedBankroll, consecutiveLosses) : null;

  function markBet(side: PositionSide) {
    if (!signal) {
      return;
    }

    setActiveBet({
      side,
      entryCents: getEntryCents(signal, side),
      eventTicker: signal.market.eventTicker,
      enteredAt: new Date().toISOString(),
      entrySpot: signal.spot.price,
    });
  }

  function finishBet() {
    if (signal && activeBet && activeBet.eventTicker === signal.market.eventTicker) {
      const exitCents = getExitCents(signal, activeBet.side);
      const pnlCents = Math.round((exitCents - activeBet.entryCents) * 10) / 10;

      setTradeMemory((records) => [
        ...records.slice(-19),
        {
          side: activeBet.side,
          entryCents: activeBet.entryCents,
          exitCents,
          pnlCents,
          eventTicker: activeBet.eventTicker,
          closedAt: new Date().toISOString(),
        },
      ]);
    }

    setActiveBet(null);
  }

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
          ) : signal && coachInstruction ? (
            <>
              <RecommendationBadge side={coachInstruction.tone} />
              <p className="eyebrow">{activeBet ? "Position coach" : "Best action now"}</p>
              <h2>{coachInstruction.headline}</h2>
              <div className="decision-panel__meta">
                <div>
                  <span>{activeBet ? "Open P/L" : "Strength"}</span>
                  <strong>
                    {activeBet && coachInstruction.pnlCents !== null
                      ? `${coachInstruction.pnlCents >= 0 ? "+" : ""}${formatCents(coachInstruction.pnlCents)}`
                      : signal.recommendation.strength}
                  </strong>
                </div>
                <div>
                  <span>{activeBet ? "Sell now" : "Edge"}</span>
                  <strong>
                    {activeBet && coachInstruction.exitCents !== null
                      ? formatCents(coachInstruction.exitCents)
                      : formatCents(signal.recommendation.edgeCents)}
                  </strong>
                </div>
              </div>
              <p className="decision-panel__stake">{coachInstruction.action}</p>
              <p className="decision-panel__entry">{coachInstruction.detail}</p>
              {!activeBet ? <p className="decision-panel__entry">{stakeAdvice}</p> : null}
            </>
          ) : null}
        </aside>
      </section>

      {signal && coachInstruction ? (
        <>
          <section className={`coach-panel coach-panel--${coachInstruction.tone}`}>
            <div className="coach-chat">
              <p className="eyebrow">Trade command center</p>
              <h2>{activeBet ? `Tracking ${sideLabel(activeBet.side)} bet` : "Tap when you enter"}</h2>
              <div className="coach-bubble">
                <strong>{coachInstruction.action}</strong>
                <p>{coachInstruction.detail}</p>
                <ul>
                  {coachInstruction.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="bet-controls">
              <label className="bankroll-field">
                <span>Bankroll for sizing</span>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={bankrollInput}
                  onChange={(event) => setBankrollInput(event.target.value)}
                />
              </label>
              <div className="stake-advice">{stakeAdvice}</div>
              {consecutiveLosses >= 2 ? (
                <div className="memory-card">Learning mode: {consecutiveLosses} recent losses. New entries and adds are tightened.</div>
              ) : null}
              {activeBet ? (
                <>
                  <div className="position-card">
                    <span>Active bet</span>
                    <strong>{sideLabel(activeBet.side)}</strong>
                    <p>
                      Entry {formatCents(activeBet.entryCents)} at {formatTime(activeBet.enteredAt)} · BTC {formatCurrency(activeBet.entrySpot)}
                    </p>
                    <p>Watch the instruction panel: it will tell you Sell now or Keep until target line is crossed.</p>
                  </div>
                  {addMoreAdvice ? <div className="stake-advice">{addMoreAdvice}</div> : null}
                  <button type="button" className="control-button control-button--sell" onClick={finishBet}>
                    I sold / bet is done
                  </button>
                </>
              ) : (
                <>
                  <button type="button" className="control-button control-button--up" onClick={() => markBet("up")}>
                    I bought Up @ {formatCents(signal.orderbook.yesAskCents)}
                  </button>
                  <button type="button" className="control-button control-button--down" onClick={() => markBet("down")}>
                    I bought Down @ {formatCents(signal.orderbook.noAskCents)}
                  </button>
                  <p>Only tap after your Kalshi order fills. This does not place trades.</p>
                </>
              )}
            </div>
          </section>

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
