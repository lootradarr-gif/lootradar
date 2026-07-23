/* Kategori + Overview zenginleştirme (APPROVED oyunlar).
   - genre: OVERRIDES[slug] (bildiğimiz oyunlar) VEYA gelişmiş keyword heuristic.
   - about/desc: oyunun KENDİ website'inin OG/meta açıklaması (solgames metni DEĞİL). Çekilemezse jenerik kalır.
   Çalıştır: node --env-file=.env.local node_modules/tsx/dist/cli.mjs scripts/enrich-games.ts [--write] */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const WRITE = process.argv.includes('--write');
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Bildiğimiz oyunların doğru genre'si (override)
const OVERRIDES: Record<string, string> = {
  kintara: 'mmo', veilbound: 'mmo', 'world-of-claudecraft': 'mmo', staratlas: 'mmo', 'star-atlas': 'mmo',
  woodtown: 'idle', 'idle-grind': 'idle', farmtown: 'idle', 'afk-heroes': 'idle', afkheroes: 'idle', 'solfarmer': 'idle',
  gorecats: 'action', rekto: 'action', taunt: 'action', 'gym-showdown': 'action', 'mattlefun': 'action', 'slop-heroes': 'shooter',
  'ledger-realms': 'rpg', chainera: 'rpg', tidefall: 'rpg', genopets: 'rpg', 'pawtato-land': 'rpg', eldoria: 'rpg',
  ante: 'strategy', 'pump-chess': 'strategy', honeyland: 'strategy', 'sol-poker': 'strategy', prediclub: 'strategy',
  pumpville: 'sim', 'bomb-sol': 'idle',
};

function heuristicGenre(n: string): string {
  const s = n.toLowerCase();
  if (/farm|harvest|garden|sprout|ranch|tree|chop|miner|mining|digg|crystal|orbital|idle/.test(s)) return 'idle';
  if (/poker|chess|card|tcg|trivia|quiz|predi|bet|flip|slot|clash of/.test(s)) return 'strategy';
  if (/snake|flappy|flap|run|kart|race|pac|jump|slide|bird|arcade|tappy/.test(s)) return 'arcade';
  if (/mmo|realm|world|kingdom|online|universe|conquest|lands|bound|scape/.test(s)) return 'mmo';
  if (/shoot|strike|siege|war|battle|arena|defend|clash|royale|slay|blast|fight|seeker|hunter|invasion/.test(s)) return 'action';
  if (/rpg|quest|legend|hero|dungeon|throne|tactics|realms/.test(s)) return 'rpg';
  return 'other';
}

// http(s) sayfadan og:description / meta description çek
async function fetchDesc(url: string): Promise<string | null> {
  try {
    const r = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0 (compatible; LootRadarBot/1.0)' }, signal: AbortSignal.timeout(8000), redirect: 'follow' });
    if (!r.ok) return null;
    const html = (await r.text()).slice(0, 200_000);
    const pick = (re: RegExp) => { const m = html.match(re); return m?.[1]?.trim(); };
    let d = pick(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)
         || pick(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i)
         || pick(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
    if (!d) return null;
    d = d.replace(/\s+/g, ' ').trim();
    return d.length >= 20 && d.length <= 400 ? d : (d.length > 400 ? d.slice(0, 300) + '…' : null);
  } catch { return null; }
}

async function main() {
  const games = await prisma.game.findMany({ where: { reviewStatus: 'APPROVED' }, select: { id: true, slug: true, name: true, genre: true, site: true, about: true } });
  console.log(`${games.length} oyun · ${WRITE ? 'WRITE' : 'DRY-RUN'}\n`);
  let g0 = 0, ovr = 0, descOk = 0;
  for (const g of games) {
    const newGenre = OVERRIDES[g.slug] || heuristicGenre(g.name);
    if (OVERRIDES[g.slug]) ovr++;
    let about = g.about;
    if (g.site) { const d = await fetchDesc(g.site); await sleep(120); if (d) { about = d; descOk++; } }
    const changed = newGenre !== g.genre || (about && about !== g.about);
    if (changed) g0++;
    if (WRITE && changed) await prisma.game.update({ where: { id: g.id }, data: { genre: newGenre, ...(about && about !== g.about ? { about, desc: about.slice(0, 200) } : {}) } });
  }
  console.log(`genre override: ${ovr} · OG açıklama çekildi: ${descOk}/${games.length} · güncellenen: ${g0}`);
  await prisma.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
