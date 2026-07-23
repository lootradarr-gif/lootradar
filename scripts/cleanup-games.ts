/* Kapsamlı yanlış/çöp oyun temizliği (seed=true auto-import'lar). Her oyunun tokenAddress'ini
   DexScreener'dan doğrular ve SİLER:
   1) Çakışma (aynı CA'yı paylaşan grup): SADECE tam isim eşleşen kalır; yoksa hepsi silinir.
   2) Canlı mcap = 0 (ölü/likidite yok).
   3) ticker SOL ya da wrapped-SOL CA (yanlışlıkla SOL'e eşleşmiş, ör. "Clans of Solana").
   4) mcap > $30M ve whitelist'te değil (şüpheli dev token eşleşmesi, ör. Stronghold $SHX $500M).
   5) İsim ile baseToken.name arasında anlamlı örtüşme yok (yanlış token).
   Çalıştır: node --env-file=.env.local node_modules/tsx/dist/cli.mjs scripts/cleanup-games.ts [--write] */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const WRITE = process.argv.includes('--write');
const norm = (s: string) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const WSOL = 'So11111111111111111111111111111111111111112';
const WHITELIST = new Set(['kintara', 'pawtato-land', 'pawtato', 'afk-heroes', 'afkheroes', 'tidefall', 'staratlas', 'star-atlas', 'genopets', 'honeyland', 'rekto', 'pump-chess', 'chainera', 'woodtown', 'slop-heroes', 'taunt', 'bomb-sol', 'bomb-miner', 'pumpville']);

// isim örtüşmesi: tam eşleşme | biri diğerini içeriyor | ≥4 harfli ortak kelime
function overlaps(gameName: string, tokenName: string): boolean {
  const a = norm(gameName), b = norm(tokenName);
  if (!b) return false;
  if (a === b || a.includes(b) || b.includes(a)) return true;
  const wa = gameName.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 4);
  const wb = new Set(tokenName.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 4));
  return wa.some((w) => wb.has(w));
}

async function dexData(ca: string): Promise<{ name: string; symbol: string; mcap: number } | null> {
  try {
    const r = await fetch('https://api.dexscreener.com/latest/dex/tokens/' + ca, { headers: { 'user-agent': 'Mozilla/5.0' } });
    const d = await r.json();
    const p = d.pairs?.[0];
    if (!p) return null;
    return { name: p.baseToken?.name || '', symbol: (p.baseToken?.symbol || '').toUpperCase(), mcap: Number(p.marketCap || p.fdv || 0) };
  } catch { return null; }
}

async function main() {
  console.log(WRITE ? '=== WRITE (siliyor) ===\n' : '=== DRY-RUN ===\n');
  const games = await prisma.game.findMany({ where: { seed: true, tokenAddress: { not: null } }, select: { id: true, slug: true, name: true, tokenAddress: true } });
  const byCa: Record<string, typeof games> = {};
  for (const g of games) (byCa[g.tokenAddress!] ||= []).push(g);

  const del: { id: string; slug: string; reason: string }[] = [];
  const uniqueCas = Object.keys(byCa);
  for (const ca of uniqueCas) {
    const group = byCa[ca];
    const d = await dexData(ca); await sleep(140);

    // 3+4: token seviyesi kırmızı bayraklar → gruptaki HEPSİNİ sil (whitelist hariç)
    const tokenBad = !d || d.mcap === 0 || d.symbol === 'SOL' || ca === WSOL || (d.mcap > 5_000_000);
    if (tokenBad) {
      for (const g of group) {
        if (WHITELIST.has(g.slug)) continue;
        const why = !d ? 'token yok' : d.mcap === 0 ? 'mcap $0 (ölü)' : (d.symbol === 'SOL' || ca === WSOL) ? 'SOL token (yanlış)' : `mcap $${(d.mcap / 1e6).toFixed(1)}M şüpheli (>$5M)`;
        del.push({ id: g.id, slug: g.slug, reason: why });
      }
      continue;
    }

    // çakışma: tam isim eşleşeni tut, gerisini sil; tam eşleşme yoksa hepsi
    if (group.length > 1) {
      const exact = group.find((g) => norm(g.name) === norm(d.name));
      for (const g of group) { if (exact && g.id === exact.id) continue; del.push({ id: g.id, slug: g.slug, reason: exact ? `dup ("${exact.slug}" doğru)` : `dup, token="${d.name}" hiçbirine uymuyor` }); }
      continue;
    }

    // tekil: isim örtüşmüyorsa yanlış token
    const g = group[0];
    if (!WHITELIST.has(g.slug) && !overlaps(g.name, d.name)) del.push({ id: g.id, slug: g.slug, reason: `isim uyuşmuyor (token="${d.name}")` });
  }

  del.sort((a, b) => a.reason.localeCompare(b.reason));
  for (const x of del) console.log(`  ✗ ${x.slug.padEnd(26)} ${x.reason}`);
  console.log(`\nSilinecek: ${del.length} / ${games.length} seed oyun`);

  if (WRITE && del.length) {
    const ids = del.map((d) => d.id);
    await prisma.$transaction([
      prisma.vote.deleteMany({ where: { gameId: { in: ids } } }),
      prisma.event.deleteMany({ where: { gameId: { in: ids } } }),
      prisma.favorite.deleteMany({ where: { gameId: { in: ids } } }),
      prisma.post.deleteMany({ where: { gameId: { in: ids } } }),
      prisma.boost.deleteMany({ where: { gameId: { in: ids } } }),
      prisma.game.deleteMany({ where: { id: { in: ids } } }),
    ]);
    console.log('Silindi ✓');
  }
  await prisma.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
