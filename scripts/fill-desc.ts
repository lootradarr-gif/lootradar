/* 27 açıklaması eksik oyuna, sitelerinden toplanan GERÇEK sinyallere dayalı ELLE yazılmış
   kısa açıklamalar. Sinyali olmayanlar için kısa+doğru genel metin (uydurma özellik YOK).
   Çalıştır: node --env-file=.env.local node_modules/tsx/dist/cli.mjs scripts/fill-desc.ts [--write] */
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const WRITE = process.argv.includes('--write');

// slug → { about, genre? } — site içeriğinden doğrulanan bilgiye dayalı
const DESC: Record<string, { about: string; genre?: string }> = {
  relic: { about: 'An isometric dungeon-crawler MMO on Solana — explore, fight and loot with a player-driven economy.', genre: 'rpg' },
  'pokos-mint-garden': { about: "A cozy idle game about collecting soft little frogs and growing your own Poko garden.", genre: 'idle' },
  valora: { about: 'A browser-based turn-based tactical MMORPG set in the realm of Valdoria.', genre: 'mmo' },
  'goblin-royale': { about: 'A play-and-unlock goblin battler on Solana, with wagering on the way — hold $GRR to play.', genre: 'action' },
  'chiki-monsters': { about: 'A monster-collecting adventure set in the world of Chikoria on Solana.', genre: 'rpg' },
  kora: { about: 'A fantasy RPG on Solana with seasonal events, ancient trials and crystal-hunting.', genre: 'rpg' },
  agartha: { about: 'A lore-driven Antarctic-expedition adventure game on Solana.', genre: 'rpg' },
  rancho: { about: 'El Duttin Rancho — a family-defense action game on Solana.', genre: 'action' },
  'fight-life': { about: 'A fighting game on Solana powered by $FIGHT, with an on-chain airdrop for players.', genre: 'action' },
  'league-of-trenches': { about: 'A competitive multiplayer arena game on Solana.', genre: 'action' },
  trenchia: { about: 'An on-chain trenches-themed game on Solana.', genre: 'action' },
  'ledger-realms': { about: 'A fantasy realms RPG on Solana with an on-chain economy.', genre: 'rpg' },
  havens: { about: 'A browser MMO on Solana — explore, gather and build your inventory.', genre: 'mmo' },
  'ni-ka': { about: 'An arcade game on Solana — quick, casual, play-to-earn.', genre: 'arcade' },
  'fast-poker': { about: 'Fast-paced on-chain poker on Solana.', genre: 'strategy' },
  'ruby-trivia': { about: 'An AI-powered on-chain trivia game on Solana.', genre: 'strategy' },
  'world-bet-fun': { about: 'An on-chain prediction & betting game on Solana.', genre: 'strategy' },
  pokefun: { about: 'A monster-collecting game on Solana.', genre: 'rpg' },
  hexel: { about: 'An on-chain arcade game on Solana.', genre: 'arcade' },
  slyther: { about: 'A multiplayer snake-style arcade game on Solana.', genre: 'arcade' },
  marshiba: { about: 'A casual play-to-earn game on Solana.', genre: 'arcade' },
  spiny: { about: 'A fast arcade game on Solana.', genre: 'arcade' },
  'infinity-blast': { about: 'An arcade blast game on Solana.', genre: 'arcade' },
  realm: { about: 'A social life-simulation game on Solana.', genre: 'sim' },
  'nitro-machines': { about: 'A racing game on Solana.', genre: 'arcade' },
  heisted: { about: 'A heist-themed multiplayer game on Solana.', genre: 'action' },
  farlands: { about: 'An exploration adventure game on Solana.', genre: 'rpg' },
};

async function main() {
  let n = 0;
  for (const [slug, { about, genre }] of Object.entries(DESC)) {
    const g = await prisma.game.findUnique({ where: { slug }, select: { id: true } });
    if (!g) { console.log('~ yok:', slug); continue; }
    console.log(`✓ ${slug}: ${about.slice(0, 70)}…`);
    if (WRITE) await prisma.game.update({ where: { id: g.id }, data: { about, desc: about.slice(0, 200), ...(genre ? { genre } : {}) } });
    n++;
  }
  console.log(`\n${n} açıklama ${WRITE ? 'yazıldı' : '(dry-run)'}`);
  await prisma.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
