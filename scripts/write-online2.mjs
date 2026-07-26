import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const WRITE = process.argv.includes('--write');
const norm = k => k.toLowerCase().replace(/[^a-z0-9]/g,'');
const STRONG = new Set(['online','playersonline','onlineplayers','ccu','activeplayers','currentplayers','onlinecount','playercount','liveplayers','concurrent','concurrentusers','onlinenow']);
const WEAK = new Set(['players','count','active','live','users']);
const MAX=200000;
const scalar=v=>{if(typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=MAX)return Math.round(v);if(typeof v==='string'&&/^\d{1,6}$/.test(v.trim())){const n=+v.trim();if(n<=MAX)return n;}return null;};
function fb(v,keys,d=0){if(!v||typeof v!=='object'||d>4)return null;for(const k of Object.keys(v)){if(keys.has(norm(k))){const n=scalar(v[k]);if(n!==null)return n;}}for(const k of Object.keys(v)){const n=fb(v[k],keys,d+1);if(n!==null)return n;}return null;}
const pick=v=>{const r=scalar(v);if(r!==null&&(typeof v==='number'||typeof v==='string'))return r;return fb(v,STRONG)??fb(v,WEAK);};
const EP={ 'kintara':'https://kintara.gg/api/site/stats','solanascape':'https://solanascape.online/api/world/status','farmtown':'https://www.farmtown.online/api/public/stats' };
const UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0';
(async()=>{
  console.log(WRITE?'=== WRITE ===':'=== DRY ===');
  for(const [slug,url] of Object.entries(EP)){
    let val=null; try{const r=await fetch(url,{headers:{'user-agent':UA,accept:'application/json'}});if(r.ok){const ct=r.headers.get('content-type')||'';val=pick(ct.includes('json')?await r.json():await r.text());}}catch(e){console.log(slug,'ERR',e.message);}
    console.log(slug.padEnd(14),'resolved='+(val===null?'NULL':val),url);
    if(WRITE&&val!==null){try{await prisma.game.update({where:{slug},data:{onlineApiUrl:url}});}catch(e){console.log(slug,'UPD ERR',e.code||e.message);}}
  }
  await prisma.$disconnect();
})().catch(e=>{console.error(e);process.exit(1);});
