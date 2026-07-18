// 12 tohum oyununu (games.ts) Neon DB'ye upsert eder. Tekrar çalıştırılabilir (slug'a göre upsert).
// Çalıştır: node --env-file=.env node_modules/tsx/dist/cli.mjs prisma/seed.ts
import { PrismaClient, GameStatus } from '@prisma/client';
import { GAMES } from '../src/lib/games';

const prisma = new PrismaClient();

function mapStatus(s: string): GameStatus {
  if (s === 'PRE-TOKEN') return GameStatus.PRE_TOKEN;
  if (s === 'MAINNET') return GameStatus.MAINNET;
  if (s === 'TGE') return GameStatus.TGE;
  return GameStatus.BETA;
}

async function main() {
  for (const g of GAMES) {
    const pre = g.status === 'PRE-TOKEN';
    const data = {
      name: g.name,
      ticker: g.ticker,
      genre: g.genre,
      desc: g.desc,
      icon: g.icon,
      iconUrl: g.iconUrl ?? null,
      status: mapStatus(g.status),
      chain: g.chain,
      tokenAddress: g.tokenAddress ?? null,
      x: g.x ?? null,
      site: g.site ?? null,
      playersOnline: g.playersOnline,
      holders: g.holders,
      rating: g.rating,
      // pre-token oyunlarda demo market yok
      mockPrice: pre ? null : g.m.price,
      mockMcap: pre ? null : g.m.mcap,
      mockVol24h: pre ? null : g.m.vol24h,
      mockChange24h: pre ? null : g.m.change24h,
      reviewStatus: 'APPROVED' as const,
      featured: !!g.boosted,
      seed: true,
      contact: '',
    };
    await prisma.game.upsert({
      where: { slug: g.id },
      create: { slug: g.id, ...data },
      update: data,
    });
    console.log(`✓ ${g.name} (${g.id})`);
  }
  const count = await prisma.game.count();
  console.log(`\nToplam oyun: ${count}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });
