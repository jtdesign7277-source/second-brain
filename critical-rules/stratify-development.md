# CRITICAL RULES — Stratify Development

## Jeff's Location & Timezone
- **Location**: Boston, Massachusetts
- **Timezone**: Eastern Time (ET)
- **NEVER assume market holidays without verifying the actual calendar**
- US stock market hours: 9:30 AM - 4:00 PM ET
- Pre-market: 4:00 AM - 9:30 AM ET
- After-hours: 4:00 PM - 8:00 PM ET

## Data Rules
- **NEVER use polling/setInterval for market data**
- **ALWAYS use Alpaca WebSocket streaming** for ALL price data
- Jeff pays $22,000+ for Alpaca SIP feed — polling is unacceptable
- This applies to: watchlist, ticker bar, Markets page, backtesting, everything

## Deployment Rules
- Never deploy from local — local repo may be out of sync
- Only deploy via Vercel Dashboard or GitHub pushes
- Codex handles code changes, pushes to GitHub, Vercel auto-deploys

Last updated: February 17, 2026
