/* Tüm APPROVED oyunların holder sayısını Helius (SOLANA_RPC) ile çeker ve DB'ye yazar.
   DexScreener holder VERMEZ → Helius getTokenAccounts (lib/holders.ts). Cron 6 saatte bir bunu
   yapar ama yeni import edilenleri hemen doldurmak için elle çalıştırılır.
   Çalıştır: node --env-file=.env.prod node_modules/tsx/dist/cli.mjs scripts/refresh-holders.ts */
import { PrismaClient } from '@prisma/client';
import { fetchHolderCount } from '../src/lib/holders';

const prisma = new PrismaClient();
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const games = await prisma.game.findMany({ where: { reviewStatus: 'APPROVED', tokenAddress: { not: null } }, select: { id: true, slug: true, tokenAddress: true } });
  console.log(`${games.length} oyun · holder çekiliyor (Helius)…`);
  let done = 0, ok = 0;
  const BATCH = 5;
  for (let i = 0; i < games.length; i += BATCH) {
    const batch = games.slice(i, i + BATCH);
    await Promise.all(batch.map(async (g) => {
      try {
        const h = await fetchHolderCount(g.tokenAddress!);
        if (h != null) { await prisma.game.update({ where: { id: g.id }, data: { holders: h, holdersFetchedAt: new Date() } }); ok++; }
      } catch { /* atla */ }
      done++;
    }));
    if (i % 20 === 0) console.log(`  … ${done}/${games.length} (${ok} güncellendi)`);
    await sleep(300);
  }
  console.log(`\nBitti: ${ok}/${games.length} oyun holder güncellendi.`);
  await prisma.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
