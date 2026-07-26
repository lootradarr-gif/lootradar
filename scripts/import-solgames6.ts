/* solgames.buzz'dan ELLE toplanan 6 oyun (DexScreener ticker-araması bulamamıştı).
   Contract adresleri solgames oyun sayfalarından alındı. Her CA için:
   - DexScreener /tokens/<CA> ile pair varsa → icon/banner/sosyal/market ORADAN (kesin).
   - Pair yoksa (pump.fun'da index'siz) → solgames market verisi (fallbackMarket) + oyunun kendi
     sitesinin og:image'ı icon/banner olarak kullanılır.
   Hepsi reviewStatus:PENDING yazılır. DRY-RUN varsayılan; yazmak için --write.
   Çalıştır: node --env-file=.env.local node_modules/tsx/dist/cli.mjs scripts/import-solgames6.ts [--write] */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const WRITE = process.argv.includes('--write');

type Row = {
  name: string; ticker: string; genre: string; ca: string;
  site: string; x: string; discord?: string; telegram?: string;
  about: string;
  imgFallback?: string; // site og:image de yoksa son çare banner/icon (ör. solgames screenshot)
  // DexScreener'da pair yoksa kullanılacak solgames verisi
  fallback: { price: number; mcap: number; vol24h: number; change24h: number };
};

const GAMES: Row[] = [
  {
    name: 'Rosentica', ticker: 'FREYA', genre: 'card', ca: 'EybU41yD9sAvECDuRuRiDKssf5qBFHzeQgaNWE4rbonk',
    site: 'https://rosentica.com/', x: 'https://x.com/Rosentica',
    about: "Rosentica: One Arena is an on-chain collectibles battle game on Solana. Use real-world TCG cards — Pokémon, anime and sports cards — to fight in Pack Royale and 1v1 Pack Duels, win packs, and pull new cards through gacha. Blockchain-verified ownership bridges physical and digital collecting.",
    fallback: { price: 0.001539, mcap: 1_540_000, vol24h: 37_000, change24h: 2.0 },
  },
  {
    name: 'Kingdom Realms', ticker: 'GEMS', genre: 'idle', ca: '8hkZi7MhuP5w9nGEtLEX8UDpLvbQRrQzAZXQQsUxpump',
    site: 'https://kingdomrealms.fun/', x: 'https://x.com/KingdomRealmsO',
    about: "Kingdom Realms is an idle / RTS kingdom builder on Solana. Build and manage a medieval kingdom that passively generates gold, food, wood and stone, raid monster camps for rare materials, and level up for farming and crafting yield bonuses. Token-gated play powered by the on-chain $GEMS token.",
    fallback: { price: 0.0000022, mcap: 2_200, vol24h: 8, change24h: -0.7 },
  },
  {
    name: 'VERSUS', ticker: 'VERSUS', genre: 'strategy', ca: '8f4vCevJRF43b2n6mHPBCgHKuoAN71vyGEwQo3NJpump',
    site: 'https://versusonchain.app/', x: 'https://x.com/Versusonchain',
    about: "VERSUS is a 1v1 trading eSport on Solana. Two players enter a timed 180-second arena and the trader with the best P&L takes the pot — fast, skill-based rounds with on-chain settlement. Competitive mode, leaderboards, clans and clan wars are on the roadmap. Powered by the $VERSUS token.",
    fallback: { price: 0.0000020, mcap: 2_100, vol24h: 3_200, change24h: -9.3 },
  },
  {
    name: 'SlideCup', ticker: 'SLIDECUP', genre: 'sports', ca: 'DgrWZwEW8H4oXgakjPHKnbLkiEejucZgBvujufRApump',
    site: 'https://slidecup.com/', x: 'https://x.com/iamtonysolana',
    about: "SlideCup is a skill-based PvP finger-soccer game on Solana. Recruit football superstars, manage squad formations and battle head-to-head in real-time browser matches — play for free or wager SOL. An NFT roadmap will make each player a tradeable collectible. Powered by the $SLIDECUP token.",
    fallback: { price: 0.0000022, mcap: 2_300, vol24h: 346, change24h: -21.7 },
  },
  {
    name: 'World of Manlets', ticker: 'WoM', genre: 'rpg', ca: 'FG1bQQbpE4oY6nib4W51A9EJqFju2RdYdyo1qRpwpump',
    site: 'https://www.worldofmanlets.com/', x: 'https://x.com/worldofmanlets',
    about: "World of Manlets is a Crypto-Twitter-native browser MMORPG on Solana. Slay jeets, farm gold and unlock cosmetic skins while surviving the trenches — jump in as a guest or register an account, with a live homepage player counter. Powered by the on-chain $WoM token.",
    fallback: { price: 0.0000020, mcap: 2_000, vol24h: 67, change24h: 0 },
  },
  {
    name: 'Aquarium.wtf', ticker: 'FISH', genre: 'survival', ca: '4F1id46kLCxhpwszcRFRXvj3uzk3eEG5ycXuN5S4pump',
    site: 'https://aquarium.wtf/', x: 'https://x.com/boogaav',
    about: "Aquarium.wtf is a real-time multiplayer survival game on Solana that reimagines 'eat or be eaten'. Enter a 24-hour arena as a fish, survive to split the prize pool, and compete against both human wallets and autonomous AI agents. Powered by the $FISH token.",
    imgFallback: 'https://solgames.buzz/api/screenshots/461.png',
    fallback: { price: 0.0000021, mcap: 2_200, vol24h: 5, change24h: 0 },
  },
];

const slugify = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_-]+/g, '-').slice(0, 40);
const abs = (u: string, base: string) => { try { return new URL(u, base).href; } catch { return u; } };
const social = (info: any, type: string) => (info.socials || []).find((s: any) => (s.type || '').toLowerCase() === type)?.url || null;

// DexScreener token endpoint — CA ile kesin eşleşme
async function dexByCA(ca: string): Promise<any | null> {
  try {
    const r = await fetch('https://api.dexscreener.com/latest/dex/tokens/' + ca, { headers: { 'user-agent': 'Mozilla/5.0' } });
    if (!r.ok) return null;
    const d = await r.json();
    const pairs = (d.pairs || []).filter((p: any) => p.chainId === 'solana');
    if (!pairs.length) return null;
    // en likit pair
    pairs.sort((a: any, b: any) => Number(b?.liquidity?.usd || 0) - Number(a?.liquidity?.usd || 0));
    return pairs[0];
  } catch { return null; }
}

// Oyunun KENDİ sitesinden og:image (banner/icon) — DexScreener'da görsel yoksa
async function siteOgImage(site: string): Promise<string | null> {
  try {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 9000);
    const r = await fetch(site, { headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36' }, signal: ctrl.signal });
    clearTimeout(to);
    if (!r.ok) return null;
    const html = await r.text();
    const og = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
            || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)
            || html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);
    if (og) return abs(og[1], site);
    const icon = html.match(/<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]+href=["']([^"']+)["']/i);
    if (icon) return abs(icon[1], site);
    return null;
  } catch { return null; }
}

async function main() {
  console.log(WRITE ? '=== WRITE MODU (DB\'ye PENDING) ===\n' : '=== DRY-RUN ===\n');
  let wrote = 0, dup = 0;
  for (const g of GAMES) {
    const slug = slugify(g.name);
    const existing = await prisma.game.findUnique({ where: { slug }, select: { id: true } });
    if (existing) { console.log(`↻ ${g.name}: zaten var`); dup++; continue; }

    const pair = await dexByCA(g.ca);
    let iconUrl: string | null = null, bannerUrl: string | null = null;
    let x = g.x, discord: string | null = g.discord ?? null, telegram: string | null = g.telegram ?? null;
    let site = g.site, symbol = g.ticker, mkt = g.fallback, src = 'solgames';

    if (pair) {
      const info = pair.info || {}, bt = pair.baseToken || {};
      symbol = bt.symbol || g.ticker;
      iconUrl = info.imageUrl || null;
      bannerUrl = info.header || null;
      x = social(info, 'twitter') || g.x;
      discord = social(info, 'discord') || discord;
      telegram = social(info, 'telegram') || telegram;
      site = (info.websites || [])[0]?.url || g.site;
      mkt = {
        price: Number(pair.priceUsd || 0) || g.fallback.price,
        mcap: Number(pair.marketCap || pair.fdv || 0) || g.fallback.mcap,
        vol24h: Number(pair.volume?.h24 || 0) || g.fallback.vol24h,
        change24h: pair.priceChange?.h24 != null ? Number(pair.priceChange.h24) : g.fallback.change24h,
      };
      src = 'dexscreener';
    }
    // DexScreener görseli yoksa oyunun kendi sitesinin og:image'ı, o da yoksa imgFallback
    if (!iconUrl) { const og = await siteOgImage(g.site); iconUrl = og; if (!bannerUrl) bannerUrl = og; }
    if (!bannerUrl && g.imgFallback) bannerUrl = g.imgFallback;

    console.log(`✓ ${g.name.padEnd(18)} $${symbol.padEnd(9)} src:${src.padEnd(12)} mc:$${Math.round(mkt.mcap/1000)}K icon:${iconUrl ? 'y' : 'N'} banner:${bannerUrl ? 'y' : 'N'} x:${x ? 'y' : '-'}`);

    if (WRITE) {
      await prisma.game.create({
        data: {
          slug, name: g.name, ticker: symbol, genre: g.genre,
          desc: `${g.name} — a ${g.genre} game on Solana.`, about: g.about,
          status: 'MAINNET', chain: 'solana', tokenAddress: g.ca,
          iconUrl, bannerUrl, x, site, discord, telegram,
          mockPrice: mkt.price, mockMcap: mkt.mcap, mockVol24h: mkt.vol24h, mockChange24h: mkt.change24h,
          reviewStatus: 'PENDING', verified: false, seed: true,
        },
      });
      wrote++;
    }
  }
  console.log(`\nBitti: ${wrote} DB'ye PENDING yazıldı · ${dup} zaten var`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
