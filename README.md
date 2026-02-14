# Second Brain

Personal knowledge base & journal with AI chat, stock widgets, and Stripe subscription.

## Stack
- **Next.js 15** (App Router, TypeScript)
- **TailwindCSS** (dark theme)
- **Supabase** (auth + PostgreSQL)
- **Anthropic Claude** (AI chat - Fred)
- **Stripe** (Pro subscription)
- **TradingView** (embedded widgets)

## Setup
1. Copy `.env.local.example` to `.env.local` and fill in values
2. `npm install`
3. `npm run dev`

## Deploy
Push to `main` → Vercel auto-deploys.

## Features
- Document CRUD with search
- AI chat with Fred (Claude streaming)
- TradingView widgets (SPY, AAPL, BTC)
- Stripe Pro subscription gating
- Dark zinc-950 theme
