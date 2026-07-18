# LootRadar

The Web3 game radar (lootradar.io). On-chain game discovery + directory — projects list for free (or pay in SOL to boost), with live token charts (DexScreener) and online player counts. Launching on Solana, built chain-agnostic. Style: clean dark UI, single electric-blue accent.

## Stack
- Next.js 14 (App Router) + TypeScript + Tailwind
- Market data: **DexScreener** public API (no key) + embed charts
- Submissions: file store now (`/data`), Prisma later

## Dev
```bash
npm install
npm run dev        # http://localhost:3200
```

## Pages
| Route | What |
|---|---|
| `/` | Discover — hero, live market readout, trending cards, mcap dominance, gainers/losers, community, events |
| `/rankings` | Full table, ranked by market cap |
| `/game/[id]` | Detail + live DexScreener chart embed |
| `/feed` | Community posts + live events |
| `/community` | Player/activity hub |
| `/boost` | Paid tiers (Free / Boost / Featured) |
| `/submit` | Listing form → `POST /api/submit` |
| `/admin?key=SECRET` | Review + approve/reject submissions |

## Adding a game
Edit `src/lib/games.ts`. Set `tokenAddress` to the Solana mint to switch that game
from mock numbers to **live** DexScreener data + chart automatically.

## Env
`SOLGAMES_ADMIN_SECRET` — gate for `/admin`. See `.env.example`.

## Deploy
Vercel (new project on the existing Pro plan). No extra backend needed —
DexScreener is called server-side with 60s revalidate; submissions use the
filesystem in dev and `/tmp` on Vercel (swap to the shared Railway Postgres via
Prisma when persistence is needed).
