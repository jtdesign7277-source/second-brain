import type { DocumentItem } from "@/types/documents";

const STORAGE_KEY = "second-brain-documents";
const SEED_KEY = "second-brain-seeded";

const seedDocs: Omit<DocumentItem, "id">[] = [
  {
    user_id: "local",
    title: "📅 February 14, 2026 — Daily Summary",
    folder: "2026-02-14 — Second Brain Rebuild",
    created_at: "2026-02-14T12:00:00.000Z",
    updated_at: "2026-02-14T20:00:00.000Z",
    content: `# February 14, 2026 — Valentine's Day

## What We Built
- **Second Brain web app** — full rebuild from scratch using Codex (gpt-5.2-codex)
  - Next.js 15, TailwindCSS, dark zinc-950 theme
  - Sidebar with document CRUD + search
  - TradingView widgets (SPY, AAPL, BTC)
  - Fred AI chat panel (Claude streaming)
  - Stripe subscription routes (ready for Pro gating)
- **Market Intel Scanner** — new cron job, runs every 2 hours
  - Scans X, Bloomberg, Yahoo Finance, sports betting, Tesla/SpaceX, M&A
  - Saves to third-brain/market-intel/ and second-brain/market-intel/
- **Daily Second Brain Summary** — new cron job, runs at 11 PM ET

## What We Fixed
- Anthropic SDK package name (\`@anthropic-ai/sdk\` not \`anthropic\`)
- Lazy init all server clients to prevent build-time env crashes
- X bot MY_ID bug fixed (likes were failing on previous runs)
- ANTHROPIC_API_KEY added to ~/.zshrc for X engagement bot
- Switched documents from Supabase to localStorage (no extra DB needed)

## Key Decisions
- Second Brain gets its OWN Supabase project (separate from Stratify)
- Documents stored in localStorage for now (like old v0 version)
- Daily summary cron writes to local files + web app

## Important Info
- **Stratify email:** jeff@stratify-associates.com
- **Second Brain URL:** second-brain-beige-gamma.vercel.app
- **GitHub:** jtdesign7277-source/second-brain
- **X bot followers:** 22 → 23 today
- **Anthropic key** added to Vercel + ~/.zshrc

## Active Cron Jobs
1. StratifyAI X Engagement — hourly
2. Market Intel Scanner — every 2 hours
3. Daily Second Brain Summary — 11 PM ET
`,
  },
  {
    user_id: "local",
    title: "🔧 Vercel Environment Variables",
    folder: "2026-02-14 — Second Brain Rebuild",
    created_at: "2026-02-14T14:00:00.000Z",
    updated_at: "2026-02-14T14:00:00.000Z",
    content: `# Vercel Environment Variables — Second Brain

## Configured ✅
- STRIPE_SECRET_KEY
- VITE_STRIPE_PUBLISHABLE_KEY
- STRIPE_PRO_PRICE_ID
- SUPABASE_SERVICE_ROLE_KEY
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY
- ANTHROPIC_API_KEY
`,
  },
  {
    user_id: "local",
    title: "💳 Stripe Integration — Live",
    folder: "2026-02-14 — Second Brain Rebuild",
    created_at: "2026-02-14T14:30:00.000Z",
    updated_at: "2026-02-14T14:30:00.000Z",
    content: `# Stripe Integration — Live ✅

## What's Live

### Database
- Supabase profiles table has subscription columns

### Stripe
- **Product:** Stratify Pro @ $9.99/mo (live mode)
- **Webhook** listening for 3 events → Vercel endpoint

### Vercel
- 7 env vars configured
- 3 API serverless functions deployed:
  - /api/create-checkout-session
  - /api/stripe-webhook
  - /api/create-portal-session

### Frontend
- useSubscription hook ready for feature gating
- UpgradePrompt component ready to drop into gated features
`,
  },
  {
    user_id: "local",
    title: "📊 Market Intel — Feb 14, 2026",
    folder: "2026-02-14 — Second Brain Rebuild",
    created_at: "2026-02-14T16:00:00.000Z",
    updated_at: "2026-02-14T16:00:00.000Z",
    content: `# Market Intel — Sat Feb 14, 4:00 PM ET

🔥 **Gold smashes $5,000** ($5,046, +2.0%), silver rips +3%. XRP surges +5.9% leading crypto.

## Quick Hits
- **S&P 500** 6,836 (+0.05%) | **Nasdaq** -0.22% | **Dow** 49,501 (+0.10%)
- **TSLA** $417.44 flat — Cybercab production challenges, AI/robotics pivot. Benchmark PT $475
- **BTC** $69,930 (+1.7%) grinding toward $70K
- **XRP** $1.49 (+5.9%) 🔥
- **SOL** $88 (+3.7%)
- **Russell 2000** +1.18% — small caps outperforming
- **10Y yield** 4.048% | **VIX** 20.60
- **Canada TSX** +1.87% riding the commodity wave
`,
  },
];

export function seedIfNeeded() {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(SEED_KEY)) return;

  const existing = localStorage.getItem(STORAGE_KEY);
  if (existing) {
    try {
      const docs = JSON.parse(existing);
      if (docs.length > 0) {
        localStorage.setItem(SEED_KEY, "true");
        return;
      }
    } catch {}
  }

  const docs: DocumentItem[] = seedDocs.map((d) => ({
    ...d,
    id: crypto.randomUUID(),
  }));

  localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
  localStorage.setItem(SEED_KEY, "true");
}
