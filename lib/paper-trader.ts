import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { getBtcSignal, type BtcSignal, type SignalSide } from "@/lib/kalshi-btc";

type PositionSide = Exclude<SignalSide, "pass">;

type PaperPosition = {
  id: string;
  side: PositionSide;
  eventTicker: string;
  openedAt: string;
  updatedAt: string;
  entryCents: number;
  averageEntryCents: number;
  contracts: number;
  stakeDollars: number;
  targetPrice: number;
  entrySpot: number;
  lastSpot: number;
  addCount: number;
};

type PaperTrade = {
  id: string;
  side: PositionSide;
  eventTicker: string;
  openedAt: string;
  closedAt: string;
  entryCents: number;
  exitCents: number;
  contracts: number;
  stakeDollars: number;
  returnedDollars: number;
  pnlDollars: number;
  reason: string;
};

type PaperState = {
  startedAt: string;
  updatedAt: string;
  initialBalance: number;
  cash: number;
  openPosition: PaperPosition | null;
  trades: PaperTrade[];
  lastAction: string;
  lastActionAt: string | null;
};

export type PaperTraderSnapshot = PaperState & {
  signal: BtcSignal;
  equity: number;
  openValue: number;
  openPnlDollars: number;
  realizedPnlDollars: number;
  totalPnlDollars: number;
  wins: number;
  losses: number;
  consecutiveLosses: number;
  winRate: number;
  botAdvice: string;
  addMoreAdvice: string;
};

const INITIAL_BALANCE = 5;
const DATA_DIR = path.join(process.cwd(), ".data");
const STATE_PATH = path.join(DATA_DIR, "paper-trader.json");
const MIN_OPEN_EDGE_CENTS = 10;
const MIN_OPEN_SECONDS = 120;
const MIN_ADD_EDGE_CENTS = 14;
const MIN_ADD_SECONDS = 180;
const MAX_ADDS_PER_POSITION = 1;

function roundMoney(value: number) {
  return Math.round(value * 10000) / 10000;
}

function nowIso() {
  return new Date().toISOString();
}

function newId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createInitialState(): PaperState {
  const now = nowIso();

  return {
    startedAt: now,
    updatedAt: now,
    initialBalance: INITIAL_BALANCE,
    cash: INITIAL_BALANCE,
    openPosition: null,
    trades: [],
    lastAction: "Paper trader initialized with $5 fake balance.",
    lastActionAt: now,
  };
}

async function readState() {
  try {
    const raw = await readFile(STATE_PATH, "utf8");
    return JSON.parse(raw) as PaperState;
  } catch {
    return createInitialState();
  }
}

async function writeState(state: PaperState) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(STATE_PATH, `${JSON.stringify(state, null, 2)}\n`);
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

function hasCrossedTargetLine(signal: BtcSignal, side: PositionSide) {
  return side === "up" ? signal.spot.price >= signal.market.targetPrice : signal.spot.price < signal.market.targetPrice;
}

function getConsecutiveLosses(trades: PaperTrade[]) {
  let losses = 0;

  for (const trade of trades.slice().reverse()) {
    if (trade.pnlDollars < 0) {
      losses += 1;
    } else {
      break;
    }
  }

  return losses;
}

function isHighConfidenceEntry(signal: BtcSignal, consecutiveLosses: number) {
  if (signal.recommendation.side === "pass") {
    return false;
  }

  if (consecutiveLosses >= 2) {
    return false;
  }

  return (
    (signal.recommendation.strength === "high" || signal.recommendation.strength === "medium") &&
    signal.recommendation.edgeCents >= MIN_OPEN_EDGE_CENTS &&
    signal.market.secondsToClose >= MIN_OPEN_SECONDS
  );
}

function chooseStakeDollars(cash: number, consecutiveLosses: number, strength: string) {
  if (consecutiveLosses > 0) {
    return Math.min(cash, Math.max(0.1, cash * 0.06));
  }

  if (strength === "high") {
    return Math.min(cash, Math.max(0.25, cash * 0.18));
  }

  return Math.min(cash, Math.max(0.15, cash * 0.1));
}

function getLateSellReason(signal: BtcSignal, position: PaperPosition) {
  const wrongSideGap = position.side === "up"
    ? Math.max(0, signal.market.targetPrice - signal.spot.price)
    : Math.max(0, signal.spot.price - signal.market.targetPrice);
  const lateGapTooLarge = wrongSideGap > Math.max(8, signal.model.estimatedMoveToClose * 0.28);

  if (signal.market.secondsToClose <= 75 && wrongSideGap > 0) {
    return `late partial-loss exit: ${wrongSideGap.toFixed(2)} away with ${signal.market.secondsToClose}s left`;
  }

  if (signal.market.secondsToClose <= 120 && lateGapTooLarge) {
    return `late gap too large: ${wrongSideGap.toFixed(2)} from target line`;
  }

  return null;
}

function shouldAddMore(signal: BtcSignal, position: PaperPosition, consecutiveLosses: number) {
  const currentAsk = getEntryCents(signal, position.side);
  const sameSideEdge = getSideEdge(signal, position.side);
  const betterPrice = currentAsk <= position.averageEntryCents - 2;

  return (
    consecutiveLosses === 0 &&
    position.addCount < MAX_ADDS_PER_POSITION &&
    signal.recommendation.side === position.side &&
    (signal.recommendation.strength === "high" || signal.recommendation.strength === "medium") &&
    signal.market.secondsToClose >= MIN_ADD_SECONDS &&
    sameSideEdge >= MIN_ADD_EDGE_CENTS &&
    betterPrice &&
    !hasCrossedTargetLine(signal, position.side)
  );
}

function buildAddMoreAdvice(signal: BtcSignal, state: PaperState, consecutiveLosses: number) {
  const position = state.openPosition;

  if (!position) {
    return "Add more: no active paper bet.";
  }

  if (consecutiveLosses >= 2) {
    return "Add more: No. Cooldown after recent losses.";
  }

  if (hasCrossedTargetLine(signal, position.side) || signal.market.secondsToClose < MIN_ADD_SECONDS) {
    return "Add more: No. Manage the exit; do not increase size late.";
  }

  if (shouldAddMore(signal, position, consecutiveLosses)) {
    return "Add more: Yes, small add allowed because price improved and same-side edge still agrees.";
  }

  return "Add more: No. Wait for a better price and stronger same-side edge.";
}

function closePosition(state: PaperState, signal: BtcSignal, reason: string) {
  const position = state.openPosition;

  if (!position) {
    return state;
  }

  const exitCents = getExitCents(signal, position.side);
  const returnedDollars = roundMoney(position.contracts * (exitCents / 100));
  const pnlDollars = roundMoney(returnedDollars - position.stakeDollars);
  const closedAt = nowIso();

  state.cash = roundMoney(state.cash + returnedDollars);
  state.openPosition = null;
  state.trades = [
    ...state.trades.slice(-99),
    {
      id: position.id,
      side: position.side,
      eventTicker: position.eventTicker,
      openedAt: position.openedAt,
      closedAt,
      entryCents: position.averageEntryCents,
      exitCents,
      contracts: position.contracts,
      stakeDollars: position.stakeDollars,
      returnedDollars,
      pnlDollars,
      reason,
    },
  ];
  state.lastAction = `Closed ${position.side.toUpperCase()} for ${pnlDollars >= 0 ? "+" : ""}$${pnlDollars.toFixed(4)} (${reason}).`;
  state.lastActionAt = closedAt;

  return state;
}

function openPosition(state: PaperState, signal: BtcSignal, side: PositionSide, consecutiveLosses: number) {
  const entryCents = getEntryCents(signal, side);
  const stakeDollars = roundMoney(chooseStakeDollars(state.cash, consecutiveLosses, signal.recommendation.strength));
  const contracts = entryCents > 0 ? roundMoney(stakeDollars / (entryCents / 100)) : 0;
  const openedAt = nowIso();

  if (stakeDollars <= 0 || contracts <= 0) {
    state.lastAction = "No open: fake cash is too low for a paper position.";
    state.lastActionAt = openedAt;
    return state;
  }

  state.cash = roundMoney(state.cash - stakeDollars);
  state.openPosition = {
    id: newId("paper"),
    side,
    eventTicker: signal.market.eventTicker,
    openedAt,
    updatedAt: openedAt,
    entryCents,
    averageEntryCents: entryCents,
    contracts,
    stakeDollars,
    targetPrice: signal.market.targetPrice,
    entrySpot: signal.spot.price,
    lastSpot: signal.spot.price,
    addCount: 0,
  };
  state.lastAction = `Opened paper ${side.toUpperCase()} with $${stakeDollars.toFixed(2)} at ${entryCents.toFixed(1)}c.`;
  state.lastActionAt = openedAt;

  return state;
}

function addToPosition(state: PaperState, signal: BtcSignal) {
  const position = state.openPosition;

  if (!position) {
    return state;
  }

  const entryCents = getEntryCents(signal, position.side);
  const addDollars = roundMoney(Math.min(state.cash, Math.max(0.1, state.cash * 0.08)));
  const addContracts = entryCents > 0 ? roundMoney(addDollars / (entryCents / 100)) : 0;
  const now = nowIso();

  if (addDollars <= 0 || addContracts <= 0) {
    return state;
  }

  const totalStake = roundMoney(position.stakeDollars + addDollars);
  const totalContracts = roundMoney(position.contracts + addContracts);

  position.averageEntryCents = roundMoney((totalStake / totalContracts) * 100);
  position.contracts = totalContracts;
  position.stakeDollars = totalStake;
  position.updatedAt = now;
  position.lastSpot = signal.spot.price;
  position.addCount += 1;
  state.cash = roundMoney(state.cash - addDollars);
  state.lastAction = `Added $${addDollars.toFixed(2)} to paper ${position.side.toUpperCase()} at ${entryCents.toFixed(1)}c.`;
  state.lastActionAt = now;

  return state;
}

function buildSnapshot(state: PaperState, signal: BtcSignal): PaperTraderSnapshot {
  const openPosition = state.openPosition;
  const openValue = openPosition ? roundMoney(openPosition.contracts * (getExitCents(signal, openPosition.side) / 100)) : 0;
  const openPnlDollars = openPosition ? roundMoney(openValue - openPosition.stakeDollars) : 0;
  const realizedPnlDollars = roundMoney(state.trades.reduce((sum, trade) => sum + trade.pnlDollars, 0));
  const equity = roundMoney(state.cash + openValue);
  const wins = state.trades.filter((trade) => trade.pnlDollars > 0).length;
  const losses = state.trades.filter((trade) => trade.pnlDollars < 0).length;
  const consecutiveLosses = getConsecutiveLosses(state.trades);
  const winRate = state.trades.length > 0 ? Math.round((wins / state.trades.length) * 1000) / 10 : 0;
  const botAdvice = openPosition
    ? hasCrossedTargetLine(signal, openPosition.side)
      ? "Bot advice: sell now; target line crossed."
      : getLateSellReason(signal, openPosition)
        ? "Bot advice: sell now; late-window partial exit is better than a full loss."
        : "Bot advice: keep until target line; do not add unless add-more says yes."
    : isHighConfidenceEntry(signal, consecutiveLosses)
      ? `Bot advice: paper bot may enter ${signal.recommendation.side.toUpperCase()} with ${signal.recommendation.strength} confidence.`
      : "Bot advice: wait; no medium/high-confidence entry.";

  return {
    ...state,
    signal,
    equity,
    openValue,
    openPnlDollars,
    realizedPnlDollars,
    totalPnlDollars: roundMoney(equity - state.initialBalance),
    wins,
    losses,
    consecutiveLosses,
    winRate,
    botAdvice,
    addMoreAdvice: buildAddMoreAdvice(signal, state, consecutiveLosses),
  };
}

export async function getPaperTraderSnapshot() {
  const [state, signal] = await Promise.all([readState(), getBtcSignal()]);
  const position = state.openPosition;

  if (position) {
    position.lastSpot = signal.spot.price;
    position.updatedAt = nowIso();
  }

  state.updatedAt = nowIso();
  await writeState(state);

  return buildSnapshot(state, signal);
}

export async function resetPaperTrader() {
  const state = createInitialState();
  await writeState(state);
  const signal = await getBtcSignal();
  return buildSnapshot(state, signal);
}

export async function runPaperTraderTick() {
  const state = await readState();
  const signal = await getBtcSignal();
  const consecutiveLosses = getConsecutiveLosses(state.trades);
  const now = nowIso();

  state.updatedAt = now;

  if (state.openPosition) {
    const position = state.openPosition;
    position.lastSpot = signal.spot.price;
    position.updatedAt = now;

    if (position.eventTicker !== signal.market.eventTicker) {
      closePosition(state, signal, "market window changed / mark settled");
    } else if (hasCrossedTargetLine(signal, position.side)) {
      closePosition(state, signal, "target line crossed");
    } else {
      const lateSellReason = getLateSellReason(signal, position);

      if (lateSellReason) {
        closePosition(state, signal, lateSellReason);
      } else if (shouldAddMore(signal, position, consecutiveLosses)) {
        addToPosition(state, signal);
      } else {
        state.lastAction = "Held paper position; target line has not crossed and no add is justified.";
        state.lastActionAt = now;
      }
    }
  } else if (isHighConfidenceEntry(signal, consecutiveLosses)) {
    openPosition(state, signal, signal.recommendation.side as PositionSide, consecutiveLosses);
  } else {
    state.lastAction = consecutiveLosses >= 2
      ? "Waited: cooldown after recent paper losses."
      : "Waited: no medium/high-confidence paper entry.";
    state.lastActionAt = now;
  }

  await writeState(state);

  return buildSnapshot(state, signal);
}
