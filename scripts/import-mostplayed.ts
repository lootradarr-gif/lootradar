/* "Most Played" import — solgames.buzz/discover → Most Played sekmesinde GÖRÜLEN, bizde OLMAYAN oyunlar.
   Her aday {name,ticker,genre,mcapK} DexScreener'dan (isim+ticker araması) çözülür + DOĞRULANIR
   (mcap eşleşmesi → yanlış token elenir), icon/banner/site/x/discord/telegram/token + Overview çekilir,
   DB'ye reviewStatus:PENDING olarak yazılır. Varsayılan DRY-RUN. Yazmak için: --write
   Çalıştır: node --env-file=.env.local node_modules/tsx/dist/cli.mjs scripts/import-mostplayed.ts [--write] */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const WRITE = process.argv.includes('--write');

// solgames.buzz "Most Played" (2026-07-26) — bizde OLMAYAN, token'ı canlı (mcap/price görünen) oyunlar.
// mcapK = solgames'in gösterdiği mcap ($K) → doğru token'ı seçmek + doğrulamak için disambiguator.
const CANDIDATES: { name: string; ticker: string; genre: string; mcapK: number }[] = [
  { name: 'Rosentica', ticker: 'FREYA', genre: 'card', mcapK: 1540 },
  { name: 'Photo Finish Live', ticker: 'CROWN', genre: 'sports', mcapK: 1150 },
  { name: 'Valannia', ticker: 'VALAN', genre: 'rpg', mcapK: 626 },
  { name: 'Gluniverse', ticker: 'GLUE', genre: 'mmo', mcapK: 93 },
  { name: 'JETDOG', ticker: 'JETDOG', genre: 'action', mcapK: 84 },
  { name: 'arrr.fun', ticker: 'ARRR', genre: 'mmorpg', mcapK: 61 },
  { name: 'MoonRaces', ticker: 'MOONXR', genre: 'racing', mcapK: 59 },
  { name: 'SnakeOG', ticker: 'SNAKE', genre: 'arcade', mcapK: 44 },
  { name: 'DeadBlock', ticker: 'DBG', genre: 'shooter', mcapK: 30 },
  { name: 'Rigs House', ticker: 'RIGS', genre: 'idle', mcapK: 15 },
  { name: 'LoopLoot', ticker: 'LOOP', genre: 'rpg', mcapK: 13 },
  { name: 'Yu-Gi-Oh.fun', ticker: 'YUGIOH', genre: 'card', mcapK: 11 },
  { name: 'TANJO World', ticker: 'TNJ', genre: 'shooter', mcapK: 10 },
  { name: 'SolValleys', ticker: 'SLV', genre: 'idle', mcapK: 9 },
  { name: 'HAVOC', ticker: 'HAVOC', genre: 'shooter', mcapK: 5 },
  { name: 'Seeker Flap', ticker: 'FLAP', genre: 'arcade', mcapK: 5 },
  { name: 'Idle Grind', ticker: 'GRIND', genre: 'idle', mcapK: 5 },
  { name: 'Glyphon', ticker: 'GLY', genre: 'rpg', mcapK: 5 },
  { name: 'Diggerz', ticker: 'DIGZ', genre: 'idle', mcapK: 3 },
  { name: 'Gold Rush', ticker: 'GOLD', genre: 'idle', mcapK: 3 },
  { name: 'Stuckman', ticker: 'STUCK', genre: 'shooter', mcapK: 2 },
  { name: 'World of Manlets', ticker: 'WoM', genre: 'rpg', mcapK: 2 },
  { name: 'SlideCup', ticker: 'SLIDECUP', genre: 'sports', mcapK: 2 },
  { name: 'Aquarium.wtf', ticker: 'FISH', genre: 'survival', mcapK: 2 },
  { name: 'VERSUS', ticker: 'VERSUS', genre: 'strategy', mcapK: 2 },
  { name: 'Kingdom Realms', ticker: 'Kingdom', genre: 'idle', mcapK: 2 },
];

const slugify = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_-]+/g, '-').slice(0, 40);

// genre → Overview cümlesi (solgames açıklaması KOPYALANMAZ, kendi metnimiz)
const GENRE_PHRASE: Record<string, string> = {
  mmo: 'a massively multiplayer online game', mmorpg: 'a massively multiplayer online RPG',
  rpg: 'an on-chain RPG', idle: 'an idle / incremental game', 'idle-rpg': 'an idle RPG',
  action: 'an action game', shooter: 'a shooter', fps: 'a first-person shooter',
  strategy: 'a strategy game', card: 'a collectible card game', arcade: 'an arcade game',
  racing: 'a racing game', sports: 'a sports game', survival: 'a survival game',
  puzzle: 'a puzzle game', moba: 'a MOBA', 'farming-sim': 'a farming simulation',
};

async function searchRaw(q: string): Promise<any[]> {
  const r = await fetch('https://api.dexscreener.com/latest/dex/search?q=' + encodeURIComponent(q), {
    headers: { 'user-agent': 'Mozilla/5.0' },
  });
  if (!r.ok) return [];
  const d = await r.json();
  return (d.pairs || []).filter((p: any) => p.chainId === 'solana');
}

// isim + ticker aramasını birleştir, pairAddress'e göre tekilleştir
async function search(name: string, ticker: string): Promise<any[]> {
  const [byName, byTicker] = await Promise.all([searchRaw(name), searchRaw(ticker)]);
  const seen = new Set<string>(); const out: any[] = [];
  for (const p of [...byName, ...byTicker]) {
    const k = p.pairAddress || (p.baseToken?.address + p.dexId);
    if (seen.has(k)) continue; seen.add(k); out.push(p);
  }
  return out;
}

const social = (info: any, type: string) => (info.socials || []).find((s: any) => (s.type || '').toLowerCase() === type)?.url || null;

async function main() {
  console.log(WRITE ? '=== WRITE MODU (DB\'ye PENDING yazılıyor) ===\n' : '=== DRY-RUN (yazma yok, --write ile yaz) ===\n');
  let ok = 0, skip = 0, dup = 0, wrote = 0;

  for (const c of CANDIDATES) {
    const slug = slugify(c.name);
    const existing = await prisma.game.findUnique({ where: { slug }, select: { id: true } });
    if (existing) { console.log(`↻ ${c.name}: zaten var (atlandı)`); dup++; continue; }

    const pairs = await search(c.name, c.ticker);
    // GÜVENLİK: yalnızca on-chain sembolü beklenen ticker ile BİREBİR eşleşen token'lar (isimden rastgele token seçme YOK)
    const tickMatch = pairs.filter((p) => (p.baseToken?.symbol || '').toUpperCase() === c.ticker.toUpperCase());
    if (!tickMatch.length) { console.log(`✗ ${c.name}: $${c.ticker} sembollü Solana token'ı bulunamadı → atlandı`); skip++; continue; }
    const pool = tickMatch;

    // DOĞRU token = beklenen mcap'e EN YAKIN olan
    const withMc = pool.map((p) => ({ p, mc: Number(p.marketCap || p.fdv || 0) }));
    withMc.sort((a, b) => Math.abs(a.mc - c.mcapK * 1000) - Math.abs(b.mc - c.mcapK * 1000));
    const best = withMc[0];
    const mcK = best.mc / 1000;
    const ratio = c.mcapK ? mcK / c.mcapK : 1;
    // Doğrulama: tek net ticker eşleşmesi → gevşek kapı (0.15x–7x). Birden fazla aday → sıkı kapı (0.3x–3.2x).
    const single = tickMatch.length === 1;
    const lo = single ? 0.15 : 0.3, hi = single ? 7 : 3.2;
    if (best.mc > 0 && (ratio < lo || ratio > hi)) { console.log(`✗ ${c.name}: mcap uyuşmadı (çözülen $${mcK.toFixed(0)}K vs beklenen $${c.mcapK}K) → yanlış token, atlandı`); skip++; continue; }
    if (best.mc === 0 && !single) { console.log(`✗ ${c.name}: mcap 0 + belirsiz eşleşme → atlandı`); skip++; continue; }

    const p = best.p, bt = p.baseToken || {}, info = p.info || {};
    const ca = bt.address;
    const iconUrl = info.imageUrl || null;
    const bannerUrl = info.header || null;
    const site = (info.websites || [])[0]?.url || null;
    const x = social(info, 'twitter');
    const discord = social(info, 'discord');
    const telegram = social(info, 'telegram');
    const phrase = GENRE_PHRASE[c.genre] || `a ${c.genre} game`;
    const desc = `${c.name} — ${phrase} on Solana.`;
    const about = `${c.name} is ${phrase} on Solana, powered by the $${bt.symbol || c.ticker} token. Track its live price, market cap and 24h volume on LootRadar and jump straight into the game.`;
    const price = Number(p.priceUsd || 0) || null;
    const vol24 = Number(p.volume?.h24 || 0) || null;
    const chg24 = p.priceChange?.h24 != null ? Number(p.priceChange.h24) : null;

    console.log(`✓ ${c.name.padEnd(20)} $${(bt.symbol || c.ticker).padEnd(8)} mc $${mcK.toFixed(0)}K icon:${iconUrl ? 'y' : 'N'} banner:${bannerUrl ? 'y' : 'N'} x:${x ? 'y' : '-'} dc:${discord ? 'y' : '-'} tg:${telegram ? 'y' : '-'} ca:${ca.slice(0, 8)}…`);
    ok++;

    if (WRITE) {
      await prisma.game.create({
        data: {
          slug, name: c.name, ticker: bt.symbol || c.ticker, genre: c.genre, desc, about,
          status: 'MAINNET', chain: 'solana', tokenAddress: ca,
          iconUrl, bannerUrl, x, site, discord, telegram,
          mockPrice: price, mockMcap: best.mc || null, mockVol24h: vol24, mockChange24h: chg24,
          reviewStatus: 'PENDING', // TÜM import'lar admin onayına → kullanıcı /admin39'dan onaylar
          verified: false, seed: true,
        },
      });
      wrote++;
    }
  }
  console.log(`\nBitti: ${ok} çözüldü/doğrulandı · ${wrote} DB'ye PENDING yazıldı · ${dup} zaten var · ${skip} atlandı (bulunamadı/yanlış token)`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
