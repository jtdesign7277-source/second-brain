# Stratify Development Update — Feb 17-19, 2026

## 🔑 CRITICAL: New Data Provider — Twelve Data
- **Signed up for Twelve Data Pro plan ($29/mo)** for international market data
- API Key: b15d4a864f04401085fae2baa50de1b5
- Env var `TWELVEDATA_API_KEY` is set in Vercel (Production, Preview, Development)
- Applied for 20% startup discount (12 months) via Twelve Data Perks program using stratify-black.vercel.app
- Pro plan provides: 48 international markets, 1,500 simultaneous WebSocket symbol subscriptions, ~170ms latency, 100+ server-side calculated technical indicators

## ✅ COMPLETED: Technical Indicators API (Priority 1)

**What:** Twelve Data's pre-calculated indicators wired directly into the Strategy Builder. No more client-side math or AI-estimated indicator values.

**Files deployed:**
- `api/lib/indicators.js` — Service library (RSI, MACD, BBands, EMA, SMA, Stoch, ADX, ATR, Supertrend, OBV, Ichimoku, batch fetcher)
- `api/indicators/[name].js` — Dynamic Vercel serverless route for any single indicator
- `api/indicators/batch.js` — Batch endpoint that fetches multiple indicators in parallel
- `src/hooks/useIndicators.js` — React hooks (useIndicator, useStrategyIndicators, evaluateSignals, STRATEGY_INDICATOR_MAP)

**Live endpoints (verified working):**
```
GET /api/indicators/rsi?symbol=AAPL&interval=1day → RSI 48.93
GET /api/indicators/batch?symbol=AAPL&indicators=rsi,macd,bbands → all 3 at once
GET /api/indicators/rsi?symbol=SHEL:LSE&interval=1day → LSE works too!
```

**Commit:** `4d95953 Strategy Builder: wire Twelve Data indicators with signals`

**Strategy template → indicator mapping:**
- Momentum → RSI, MACD, EMA 9, EMA 21, ADX
- RSI Divergence → RSI, SMA 20, ATR
- Mean Reversion → Bollinger Bands, RSI, SMA 20, Stochastic
- Breakout → Bollinger Bands, ATR, ADX, OBV
- MACD Crossover → MACD, EMA 9, EMA 21, RSI
- Scalping → Stochastic, EMA 9, ATR, RSI

**Signal evaluator:** `evaluateSignals()` reads multiple indicators and outputs BUY/SELL/HOLD with confidence percentage. This replaces Claude guessing at indicator levels — now uses real calculated values.

## ✅ COMPLETED: Global Markets / LSE Integration (Phase 1 — REST)

**What:** London Stock Exchange data feed via Twelve Data REST API with 30s polling. Initial implementation before WebSocket upgrade.

**Files deployed:**
- `api/lib/twelvedata.js` — Service library for LSE quotes, time series, search
- `api/lse/quotes.js` — Real-time quotes endpoint
- `api/lse/timeseries.js` — Historical OHLCV bars endpoint
- `api/lse/search.js` — Symbol search endpoint
- `src/hooks/useTwelveData.js` — React hooks for data consumption
- `src/components/dashboard/LSEPage.jsx` — "Global Markets" page component

**Default LSE symbols:** SHEL, AZN, HSBA, ULVR, BP, RIO, GSK, BARC, LLOY, VOD, LSEG, BATS (FTSE 100 blue chips)

**Branding:** Page named "Global Markets" (not "LSE Markets") to allow future expansion to Tokyo, Frankfurt, Hong Kong without rebranding. Sidebar icon: 🌐 Globe from lucide-react.

## ✅ COMPLETED: Global Markets / LSE Integration (Phase 2 — WebSocket Streaming)

**What:** Rebuilt with WebSocket streaming to match Alpaca architecture after Pro plan upgrade.

**Files delivered (ready for Codex install):**
- `src/services/twelveDataWebSocket.js` — Singleton WebSocket service
  - Connects to `wss://ws.twelvedata.com/v1/quotes/price`
  - Subscribe format: `{"action":"subscribe","params":{"symbols":"SHEL:LSE,BP.:LSE"}}`
  - Auto-reconnect with exponential backoff (max 10 attempts)
  - Heartbeat every 10s
  - Status callbacks: connecting/connected/reconnecting/disconnected/error
- `api/lse/ws-config.js` — Returns WebSocket URL + API key (keeps key server-side)
- Updated `src/hooks/useTwelveData.js` — Added streaming hooks (useLSEStream, useLSEPrice)
- Updated `src/components/dashboard/LSEPage.jsx` — Live streaming table with connection status

**Architecture pattern (mirrors Alpaca):**
1. Browser fetches WS config from /api/lse/ws-config
2. Browser connects directly to Twelve Data WebSocket
3. Singleton service manages subscriptions, reconnection, heartbeat
4. Components subscribe via hooks, receive real-time callbacks
5. REST endpoints handle non-streaming data (historical, search)

## 🔧 READY TO INSTALL: Trade Page LSE Charts

**What:** LSE stocks searchable and chartable on the existing Trade page. Same candlestick chart UI, different data source behind the scenes.

**Files delivered:**
- `src/components/dashboard/TwelveDataLightweightChart.jsx` — Mirrors AlpacaLightweightChart exactly but pulls OHLCV from Twelve Data

**How it works:**
- US ticker ($AAPL) → data from Alpaca via AlpacaLightweightChart (unchanged)
- LSE ticker ($SHEL) → data from Twelve Data via TwelveDataLightweightChart (new)
- Same `lightweight-charts` library renders both — user sees zero UI difference
- Subtle "All | 🇬🇧 LSE" market filter pill next to search bar
- LSE stocks show small blue "LSE" badge in search results

**Codex prompt ready** — move file then run prompt to wire into TradePage.jsx

## ✅ COMPLETED: Options Chain UI
Recent commits show options chain work was done:
- `9971acd` — DTE centered in strike column, all expirations start collapsed
- `ef26a68` — Proper options chain UI: calls left, strikes center, puts right
- `513a052` — V/OI shows dash instead of fake 999x when OI is 0

## ✅ COMPLETED: Discord Bot
- Full Discord.js bot deployed on Railway
- Slash commands: /price, /strategy, /paper-trade, /leaderboard, /alerts
- Auto-features: member welcome, cashtag detection ($AAPL triggers price reply)
- "Strategy of the Day" auto-posts at market open (9:30 AM ET)
- Rotating pool of 10 strategy types
- Scheduled market updates: pre-market (9:25), midday movers (12:30), close recap (4:05)
- Client ID: 1473555168816791643

## ✅ COMPLETED: Mission Control Weather Banner
- Animated weather banner inspired by Apple Weather app
- Live data from Open-Meteo API for Boston conditions
- Animated effects: rain, snow, clouds, sun rays based on real weather
- Market status indicators + live clock
- Deployed to Mission Control at https://mission-control-seven-henna.vercel.app/

## ✅ COMPLETED: Crypto Page Overhaul
- Removed bottom screener widget, enlarged TradingView chart
- thinkorswim-style Level 2 orderbook with bigger text
- Three-tab right panel: Level II, Time & Sales, Order Entry
- Click-to-fill: click L2 price → auto-populates limit order
- Supabase migration for storing user orders/preferences

## 📊 Current Data Architecture

Understanding how data flows through Stratify:

| Data Source | What It Provides | Where Used |
|---|---|---|
| **Alpaca (SIP feed)** | US equity real-time prices, historical bars, WebSocket streaming, order execution | Trade page charts, watchlist, live prices, order placement |
| **Twelve Data (Pro)** | LSE/international prices, WebSocket streaming, 100+ pre-calculated indicators, time series | Global Markets page, Strategy Builder indicators, LSE charts |
| **Claude AI (Anthropic)** | Strategy analysis, entry/exit logic, risk assessment, trade narrative | Strategy Builder AI Chat, backtesting analysis text |
| **TradingView Widget** | Crypto chart rendering + data (embedded widget) | Crypto page advanced chart |
| **TradingView Lightweight Charts** | Chart rendering library (open source, we provide data) | Trade page equity candlestick charts |

**Key insight:** The Trade page uses `lightweight-charts` (free library) fed by Alpaca data — NOT TradingView's expensive Advanced Charts. The crypto page uses TradingView's embedded widget which provides its own data. For LSE, we feed Twelve Data into the same lightweight-charts library.

## 🔮 Strategic Priorities (Ranked)
1. ~~Technical Indicators API → Strategy Builder~~ ✅ DONE
2. **Global Markets Expansion** — Add Tokyo (TSE), Frankfurt (XETRA), Hong Kong (HKEX) tabs. Same WebSocket, zero additional cost, different symbol suffixes
3. **Stock Profile Panel** — Company logo, profile, market cap, earnings, analyst recs on ticker click
4. **Market Movers Widget** — Top gainers/losers across all markets on dashboard homepage
5. **Enhanced Backtesting Engine** — Real calculated indicator data across multiple markets, 5+ years history

## 🔑 API Keys & Services

| Service | Plan | Cost | Key Location |
|---|---|---|---|
| Twelve Data | Pro | $29/mo | Vercel env: TWELVEDATA_API_KEY |
| Alpaca | SIP Feed | ~$1,000+ | Vercel env: ALPACA_API_KEY, ALPACA_SECRET |
| Anthropic Claude | API | Usage-based | Vercel env: ANTHROPIC_API_KEY |
| Supabase | Free/Pro | Free tier | Vercel env: SUPABASE_URL, SUPABASE_ANON_KEY |
| Stripe | Standard | Transaction % | Vercel env: STRIPE keys |

## 📝 Technical Notes
- LSE trading hours: 8am-4:30pm London time (3am-11:30am Eastern) weekdays
- Twelve Data symbol format for LSE: "SHEL:LSE", "BP.:LSE" (note BP has dot)
- Prices may be in GBX (pence) or GBP — components handle both
- Pro plan limits: 3 WebSocket connections, 1,500 symbols, 1,597 API credits + 1,500 WS credits
- TradingView Trading Platform Library application submitted for advanced chart access (free with attribution for public sites)

## 🚧 Pending / Not Yet Deployed
- Landing page visual refresh (discussed but not built — wants "premium colors and clarity")
- Global Markets WebSocket files need Codex install + git push
- TwelveDataLightweightChart.jsx needs Codex install for Trade page LSE charts
- Testing WebSocket connection during LSE market hours
- Alpaca Broker API upgrade (discussed — enables individual user brokerage accounts, KYC, funding)
- Broker credential storage encryption (UI exists, backend storage not wired)
- Wiring remaining sidebar tabs: Markets, Analytics, Portfolio, History
- Mobile responsiveness
- Fix Alpaca 401 errors on Markets page equity stream
