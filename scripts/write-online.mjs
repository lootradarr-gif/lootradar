import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const WRITE = process.argv.includes('--write');

// online.ts ile AYNI pickNumber mantığı (doğrulama için)
const norm = k => k.toLowerCase().replace(/[^a-z0-9]/g, '');
const STRONG = new Set(['online','playersonline','onlineplayers','ccu','activeplayers','currentplayers','onlinecount','playercount','liveplayers','concurrent','concurrentusers','onlinenow']);
const WEAK = new Set(['players','count','active','live','users']);
const MAX = 200000;
const scalar = v => { if (typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=MAX) return Math.round(v); if (typeof v==='string'&&/^\d{1,6}$/.test(v.trim())){const n=+v.trim(); if(n<=MAX)return n;} return null; };
function findByKeys(v, keys, d=0){ if(!v||typeof v!=='object'||d>4)return null; for(const k of Object.keys(v)){ if(keys.has(norm(k))){const n=scalar(v[k]); if(n!==null)return n;} } for(const k of Object.keys(v)){ const n=findByKeys(v[k],keys,d+1); if(n!==null)return n; } return null; }
function pickNumber(v){ const r=scalar(v); if(r!==null&&(typeof v==='number'||typeof v==='string'))return r; return findByKeys(v,STRONG) ?? findByKeys(v,WEAK); }

const EP = {
  'world-of-claudecraft': 'https://worldofclaudecraft.com/api/status',
  'gable-guardians': 'https://gableguardians.xyz/api/status',
  'blockstrike': 'https://blockstrike.fun/api/stats',
  'describe-games': 'https://describe.games/api/online',
  'yu-gi-ohfun': 'https://yu-gi-oh.fun/api/stats',
  'veilbound': 'https://veilbound.gg/api/status',
  'islands': 'https://islands.games/api/online',
  'deadblock': 'https://deadblockgame.com/api/stats',
  'pump-karts': 'https://pumpkarts.fun/stats',
  'pokecards-quest': 'https://pokecards.quest/api/status',
};
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0';

const main = async () => {
  console.log(WRITE ? '=== WRITE ===' : '=== DRY-RUN ===');
  let wrote = 0;
  for (const [slug, url] of Object.entries(EP)) {
    let val = null;
    try { const r = await fetch(url, { headers: { 'user-agent': UA, accept: 'application/json' } }); if (r.ok) { const ct = r.headers.get('content-type')||''; val = pickNumber(ct.includes('json') ? await r.json() : await r.text()); } } catch (e) { console.log(slug, 'FETCH ERR', e.message); }
    console.log(`${slug.padEnd(20)} resolved=${val === null ? 'NULL' : val}  ${url}`);
    if (WRITE && val !== null) { try { await prisma.game.update({ where: { slug }, data: { onlineApiUrl: url } }); wrote++; } catch (e) { console.log(slug, 'UPDATE ERR', e.code || e.message); } }
  }
  // SolValleys tür düzeltmesi: idle → farming
  if (WRITE) { const u = await prisma.game.updateMany({ where: { slug: 'solvalleys' }, data: { genre: 'farming' } }); console.log('SolValleys genre→farming:', u.count); }
  console.log(WRITE ? `\n${wrote} onlineApiUrl yazıldı.` : '\n(dry-run bitti)');
  await prisma.$disconnect();
};
main().catch(e => { console.error(e); process.exit(1); });
