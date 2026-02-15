import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "public", "strategy-data");
const STRATEGIES_FILE = path.join(DATA_DIR, "active-strategies.json");
const PAPER_BALANCE_FILE = path.join(DATA_DIR, "paper-balances.json");

const DEFAULT_PAPER_BALANCE = 200000;

type ActiveStrategy = {
  id: string;
  userId: string;
  documentId: string;
  title: string;
  symbol: string;
  positionSize: number;
  maxDailyTrades: number;
  stopLossPercent: number;
  takeProfitPercent: number;
  conditions: { id: string; label: string; checked: boolean }[];
  status: "active" | "inactive" | "executing" | "paused";
  activatedAt: string | null;
  trades: TradeEntry[];
  todayTradeCount: number;
  todayDate: string;
};

type TradeEntry = {
  id: string;
  timestamp: string;
  action: "BUY" | "SELL";
  symbol: string;
  quantity: number;
  price: number;
  total: number;
  reason: string;
};

type PaperBalance = {
  userId: string;
  cash: number;
  startingBalance: number;
  positions: {
    symbol: string;
    quantity: number;
    avgEntryPrice: number;
    currentValue: number;
  }[];
  totalPnl: number;
  lastUpdated: string;
};

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function loadStrategies(): Promise<ActiveStrategy[]> {
  try {
    const raw = await fs.readFile(STRATEGIES_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function saveStrategies(strategies: ActiveStrategy[]) {
  await ensureDir();
  await fs.writeFile(STRATEGIES_FILE, JSON.stringify(strategies, null, 2));
}

async function loadBalances(): Promise<PaperBalance[]> {
  try {
    const raw = await fs.readFile(PAPER_BALANCE_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function saveBalances(balances: PaperBalance[]) {
  await ensureDir();
  await fs.writeFile(PAPER_BALANCE_FILE, JSON.stringify(balances, null, 2));
}

function getOrCreateBalance(balances: PaperBalance[], userId: string): PaperBalance {
  let bal = balances.find((b) => b.userId === userId);
  if (!bal) {
    bal = {
      userId,
      cash: DEFAULT_PAPER_BALANCE,
      startingBalance: DEFAULT_PAPER_BALANCE,
      positions: [],
      totalPnl: 0,
      lastUpdated: new Date().toISOString(),
    };
    balances.push(bal);
  }
  return bal;
}

// GET — return all active strategies (optionally filter by userId)
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  const onlyActive = req.nextUrl.searchParams.get("active") === "true";

  let strategies = await loadStrategies();

  if (userId) {
    strategies = strategies.filter((s) => s.userId === userId);
  }
  if (onlyActive) {
    strategies = strategies.filter((s) => s.status === "active" || s.status === "executing");
  }

  // Also return the user's paper balance
  const balances = await loadBalances();
  const balance = userId ? getOrCreateBalance(balances, userId) : null;
  if (userId) await saveBalances(balances); // persist if new user created

  return NextResponse.json({ strategies, balance });
}

// POST — activate or update a strategy
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userId = "local",
      documentId,
      title,
      symbol,
      positionSize,
      maxDailyTrades,
      stopLossPercent,
      takeProfitPercent,
      conditions,
      status = "active",
    } = body;

    if (!documentId || !title || !symbol) {
      return NextResponse.json(
        { error: "documentId, title, and symbol are required" },
        { status: 400 }
      );
    }

    const strategies = await loadStrategies();

    // Remove existing for same user + document
    const filtered = strategies.filter(
      (s) => !(s.userId === userId && s.documentId === documentId)
    );

    const today = new Date().toISOString().slice(0, 10);

    const newStrategy: ActiveStrategy = {
      id: crypto.randomUUID(),
      userId,
      documentId,
      title,
      symbol,
      positionSize: positionSize ?? 10000,
      maxDailyTrades: maxDailyTrades ?? 10,
      stopLossPercent: stopLossPercent ?? 2,
      takeProfitPercent: takeProfitPercent ?? 4,
      conditions: conditions ?? [],
      status,
      activatedAt: status === "active" ? new Date().toISOString() : null,
      trades: [],
      todayTradeCount: 0,
      todayDate: today,
    };

    filtered.push(newStrategy);
    await saveStrategies(filtered);

    // Ensure user has a paper balance
    const balances = await loadBalances();
    getOrCreateBalance(balances, userId);
    await saveBalances(balances);

    return NextResponse.json({ ok: true, strategy: newStrategy }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "Failed to save strategy" }, { status: 500 });
  }
}

// DELETE — deactivate/remove a strategy
export async function DELETE(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId") ?? "local";
  const documentId = req.nextUrl.searchParams.get("documentId");

  if (!documentId) {
    return NextResponse.json({ error: "documentId required" }, { status: 400 });
  }

  const strategies = await loadStrategies();
  const filtered = strategies.filter(
    (s) => !(s.userId === userId && s.documentId === documentId)
  );
  await saveStrategies(filtered);

  return NextResponse.json({ ok: true, remaining: filtered.length });
}
