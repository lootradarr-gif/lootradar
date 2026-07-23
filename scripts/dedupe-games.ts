/* Yanlış-token temizliği: aynı tokenAddress'i paylaşan oyun gruplarını bulur (isim-substring
   yanlış eşleşmeleri, ör. "Seeker Flap"/"Arka Seeker" → $SKR telefon token'ı). Her grup için
   DexScreener'dan gerçek baseToken.name'i çeker, İSMİ EŞLEŞEN oyunu tutar, gerisini SİLER.
   Hiçbiri eşleşmiyorsa (CA bir oyuna ait değil) → hepsini siler.
   Çalıştır: node --env-file=.env.local node_modules/tsx/dist/cli.mjs scripts/dedupe-games.ts [--write] */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const WRITE = process.argv.includes('--write');
const norm = (s: string) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function tokenName(ca: string): Promise<string> {
  try {
    const r = await fetch('https://api.dexscreener.com/latest/dex/tokens/' + ca, { headers: { 'user-agent': 'Mozilla/5.0' } });
    const d = await r.json();
    return (d.pairs?.[0]?.baseToken?.name) || '';
  } catch { return ''; }
}

async function main() {
  console.log(WRITE ? '=== WRITE (siliyor) ===\n' : '=== DRY-RUN (silmez, --write ile sil) ===\n');
  const games = await prisma.game.findMany({ where: { tokenAddress: { not: null } }, select: { id: true, slug: true, name: true, tokenAddress: true } });
  const byCa: Record<string, typeof games> = {};
  for (const g of games) (byCa[g.tokenAddress!] ||= []).push(g);
  const collisions = Object.entries(byCa).filter(([, gs]) => gs.length > 1);
  console.log('çakışma grubu:', collisions.length, '\n');

  const toDelete: { id: string; name: string; reason: string }[] = [];
  for (const [ca, gs] of collisions) {
    const tName = await tokenName(ca); await sleep(150);
    const tn = norm(tName);
    // grup içinde ismi token adına en yakın olan
    const scored = gs.map((g) => {
      const gn = norm(g.name);
      let s = 0;
      if (gn === tn) s = 3; else if (tn && (tn.includes(gn) || gn.includes(tn))) s = 2;
      return { g, s };
    }).sort((a, b) => b.s - a.s);
    const keep = scored[0].s === 3 ? scored[0].g : null; // SADECE tam isim eşleşmesi tutulur; kısmi/eşleşmesiz → hepsi silinir
    console.log(`CA ${ca.slice(0, 8)}… token="${tName}" → tut: ${keep ? keep.name : '(hiçbiri — hepsi yanlış)'}`);
    for (const { g, s } of scored) {
      if (keep && g.id === keep.id) continue;
      toDelete.push({ id: g.id, name: g.name, reason: keep ? `"${keep.name}" doğru, bu yanlış` : `CA bir oyuna ait değil (${tName})` });
      console.log(`   ✗ sil: ${g.name}`);
    }
  }

  console.log(`\nSilinecek: ${toDelete.length} oyun`);
  if (WRITE && toDelete.length) {
    const ids = toDelete.map((d) => d.id);
    // FK: önce bağlı kayıtları temizle (varsa), sonra oyunu sil
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
