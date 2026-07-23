/* TOPLU oyun import — scripts/discover-names.txt'teki isimleri (kamuya açık gerçekler) DexScreener'da
   çözer. Doğru token'ı baseToken.name EŞLEŞMESİYLE seçer (ticker çakışmasını eler). Yüksek güven
   (isim eşleşti + likidite) → APPROVED; düşük → PENDING (admin onaylar); eşleşmeyen → atla.
   Logo + banner (header) + X + website otomatik. Kendi kısa desc'imiz — solgames metni KOPYALANMAZ.
   Çalıştır: node --env-file=.env.local node_modules/tsx/dist/cli.mjs scripts/bulk-import.ts [--write] */
import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';

const prisma = new PrismaClient();
const WRITE = process.argv.includes('--write');

const slugify = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_-]+/g, '-').slice(0, 40);
const norm = (s: string) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function genreOf(n: string): string {
  const s = n.toLowerCase();
  if (/farm|harvest|garden|sprout|ranch|tree/.test(s)) return 'idle';
  if (/miner|mining|digg|crystal|orbital/.test(s)) return 'idle';
  if (/poker|chess|card|tcg|trivia|quiz|predi|bet|flip|slot/.test(s)) return 'strategy';
  if (/snake|flappy|flap|run|kart|race|pac|jump|slide|bird/.test(s)) return 'arcade';
  if (/mmo|realm|world|kingdom|online|universe|conquest|lands/.test(s)) return 'mmo';
  if (/shoot|strike|siege|war|battle|arena|defend|clash|royale|slay|blast|fight/.test(s)) return 'action';
  if (/rpg|quest|legend|hero|dungeon|throne|tactics/.test(s)) return 'rpg';
  return 'other';
}

async function search(q: string): Promise<any[]> {
  try {
    const r = await fetch('https://api.dexscreener.com/latest/dex/search?q=' + encodeURIComponent(q), { headers: { 'user-agent': 'Mozilla/5.0' } });
    if (!r.ok) return [];
    const d = await r.json();
    return (d.pairs || []).filter((p: any) => p.chainId === 'solana');
  } catch { return []; }
}

async function main() {
  const names = readFileSync(new URL('./discover-names.txt', import.meta.url), 'utf8').split('\n').map((s) => s.trim()).filter(Boolean);
  console.log(`${names.length} aday · ${WRITE ? 'WRITE' : 'DRY-RUN'}\n`);
  let approved = 0, pending = 0, skip = 0, dup = 0;

  for (const name of names) {
    const slug = slugify(name);
    if (await prisma.game.findUnique({ where: { slug }, select: { id: true } })) { dup++; continue; }

    const pairs = await search(name);
    await sleep(180); // DexScreener rate-limit dostu
    if (!pairs.length) { skip++; continue; }

    const cn = norm(name);
    const scored = pairs.map((p) => {
      const bn = norm(p.baseToken?.name || '');
      const liq = Number(p.liquidity?.usd || 0);
      let s = 0;
      if (bn === cn) s = 3; else if (bn && (bn.includes(cn) || cn.includes(bn))) s = 2;
      return { p, s, liq };
    }).sort((a, b) => (b.s - a.s) || (b.liq - a.liq));
    const best = scored[0];

    // Güven: isim eşleşti (s>=2) ve biraz likidite → APPROVED; isim eşleşmesi zayıf ama likit → PENDING; yoksa atla
    const high = best.s >= 2 && best.liq >= 500;
    const keep = high || best.liq >= 3000; // isim eşleşmese de likitse pending'e al
    if (!keep) { skip++; continue; }

    const p = best.p, bt = p.baseToken || {}, info = p.info || {};
    const data = {
      slug, name, ticker: (bt.symbol || '').replace(/^\$/, '').slice(0, 20), genre: genreOf(name),
      desc: `${name} — a ${genreOf(name)} game on Solana.`,
      status: 'MAINNET' as const, chain: 'solana', tokenAddress: bt.address,
      iconUrl: info.imageUrl || null, bannerUrl: info.header || null,
      x: (info.socials || []).find((s: any) => s.type === 'twitter')?.url || null,
      site: (info.websites || [])[0]?.url || null,
      reviewStatus: 'PENDING' as any, verified: false, seed: true, // TÜM import'lar admin onayına → kullanıcı /admin39'dan onaylar
    };
    if (high) approved++; else pending++;
    if (WRITE) await prisma.game.create({ data });
    if ((approved + pending) % 20 === 0) console.log(`  … ${approved} approved / ${pending} pending / ${skip} skip`);
  }
  console.log(`\nBitti: ${approved} APPROVED · ${pending} PENDING · ${dup} zaten var · ${skip} çözülemedi/atlandı`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
