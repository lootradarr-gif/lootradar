/* Oyun keşif/import pipeline — aday {name,ticker,genre,mcapK} listesini DexScreener'dan çözer,
   DOĞRULAR (beklenen mcap'e en yakın Solana pair → ticker çakışmasını eler), metadata+logo+sosyal
   linkleri çeker ve DB'ye yazar. Varsayılan DRY-RUN (yazmaz). Yazmak için: --write
   Çalıştır: node --env-file=.env.local node_modules/tsx/dist/cli.mjs scripts/import-games.ts [--write] */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const WRITE = process.argv.includes('--write');

// Aday oyunlar — solgames.buzz'da GÖRÜLEN gerçek Solana oyunları (isim/ticker/genre = kamuya açık gerçekler).
// mcapK = solgames'in gösterdiği mcap ($K) → doğru token'ı seçmek + doğrulamak için disambiguator.
const CANDIDATES: { name: string; ticker: string; genre: string; mcapK: number }[] = [
  { name: 'GORECATS', ticker: 'GCATS', genre: 'action', mcapK: 34 },
  { name: 'Veilbound', ticker: 'VEIL', genre: 'mmo', mcapK: 258 },
  { name: 'Idle Grind', ticker: 'GRIND', genre: 'idle', mcapK: 2 },
  { name: 'Ledger Realms', ticker: 'LR', genre: 'rpg', mcapK: 448 },
  { name: 'Gym Showdown', ticker: 'GYM', genre: 'action', mcapK: 329 },
  { name: 'Clash of Perps', ticker: 'CLASH', genre: 'strategy', mcapK: 138 },
  { name: 'FarmTown', ticker: 'FARM', genre: 'idle', mcapK: 55 },
  { name: 'World of Claudecraft', ticker: 'WOC', genre: 'mmo', mcapK: 135 },
  { name: 'Relic', ticker: 'RELIC', genre: 'rpg', mcapK: 72 },
  { name: 'Ante', ticker: 'ANTE', genre: 'strategy', mcapK: 209 },
  { name: 'Mattle Run', ticker: 'MATTLE', genre: 'action', mcapK: 92 },
];

const slugify = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_-]+/g, '-').slice(0, 40);

async function search(q: string): Promise<any[]> {
  const r = await fetch('https://api.dexscreener.com/latest/dex/search?q=' + encodeURIComponent(q), {
    headers: { 'user-agent': 'Mozilla/5.0' },
  });
  if (!r.ok) return [];
  const d = await r.json();
  return (d.pairs || []).filter((p: any) => p.chainId === 'solana');
}

async function main() {
  console.log(WRITE ? '=== WRITE MODU (DB\'ye yazılıyor) ===' : '=== DRY-RUN (yazma yok, --write ile yaz) ===\n');
  let ok = 0, skip = 0, dup = 0;

  for (const c of CANDIDATES) {
    const slug = slugify(c.name);
    const existing = await prisma.game.findUnique({ where: { slug }, select: { id: true } });

    let pairs = await search(c.name);
    // ticker eşleşen Solana pair'ler; yoksa isimle gelen tüm Solana pair'ler
    const tickMatch = pairs.filter((p) => (p.baseToken?.symbol || '').toUpperCase() === c.ticker.toUpperCase());
    const pool = tickMatch.length ? tickMatch : pairs;
    if (!pool.length) { console.log(`✗ ${c.name}: DexScreener'da bulunamadı`); skip++; continue; }

    // DOĞRU token = beklenen mcap'e EN YAKIN olan (ticker çakışmasını eler)
    const withMc = pool.map((p) => ({ p, mc: Number(p.marketCap || p.fdv || 0) }));
    withMc.sort((a, b) => Math.abs(a.mc - c.mcapK * 1000) - Math.abs(b.mc - c.mcapK * 1000));
    const best = withMc[0];
    const mcK = best.mc / 1000;
    const ratio = c.mcapK ? mcK / c.mcapK : 1;
    // Doğrulama: seçilenin mcap'i beklenenin 0.35x–3x aralığında olmalı (değilse yanlış token → atla)
    if (ratio < 0.35 || ratio > 3) { console.log(`✗ ${c.name}: mcap uyuşmadı (çözülen $${mcK.toFixed(0)}K vs beklenen $${c.mcapK}K) → yanlış token, atlandı`); skip++; continue; }

    const p = best.p, bt = p.baseToken || {}, info = p.info || {};
    const ca = bt.address;
    const iconUrl = info.imageUrl || null;
    const bannerUrl = info.header || null; // oyunun KENDİ banner'ı (DexScreener CDN) — solgames DEĞİL
    const site = (info.websites || [])[0]?.url || null;
    const x = (info.socials || []).find((s: any) => s.type === 'twitter')?.url || null;
    const desc = `${c.name} — a ${c.genre} game on Solana.`; // kendi kısa metnimiz (solgames açıklaması KOPYALANMAZ)

    console.log(`${existing ? '↻' : '✓'} ${c.name.padEnd(20)} $${c.ticker.padEnd(7)} mc $${mcK.toFixed(0)}K icon:${iconUrl ? 'y' : 'N'} banner:${bannerUrl ? 'y' : 'N'} x:${x ? 'y' : '-'} ca:${ca.slice(0, 8)}…`);
    ok++;

    if (WRITE) {
      if (existing) {
        // Mevcut oyunu zenginleştir (banner/icon/x/site) — desc'e/onaya dokunma
        await prisma.game.update({ where: { id: existing.id }, data: { bannerUrl, iconUrl, x: x || undefined, site: site || undefined, tokenAddress: ca } });
      } else {
        await prisma.game.create({
          data: {
            slug, name: c.name, ticker: c.ticker, genre: c.genre, desc,
            status: 'MAINNET', chain: 'solana', tokenAddress: ca,
            iconUrl, bannerUrl, x, site,
            reviewStatus: 'PENDING', // TÜM import'lar admin onayına → kullanıcı /admin39'dan onaylar
            verified: false, seed: true,
          },
        });
      }
    }
  }
  console.log(`\nBitti: ${ok} çözüldü/eklendi · ${dup} zaten var · ${skip} atlandı (bulunamadı/yanlış token)`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
