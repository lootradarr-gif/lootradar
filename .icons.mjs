import { PrismaClient } from '@prisma/client';
import { put } from '@vercel/blob';
import { createHash } from 'crypto';

const APPLY = process.argv.includes('--apply');
const p = new PrismaClient();
const slugs = ['afkheroes','chainera','kintara','pawtato','pumpchess','rekto','tidefall'];
const games = await p.game.findMany({ where: { slug: { in: slugs } }, select: { slug: true, name: true, tokenAddress: true, iconUrl: true } });

for (const g of games) {
  if (g.iconUrl) { console.log(`${g.slug}: zaten ikon var, atlaniyor`); continue; }
  try {
    const r = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${g.tokenAddress}`, { headers: { 'user-agent': 'Mozilla/5.0' } });
    const src = ((await r.json()).pairs || [])[0]?.info?.imageUrl;
    if (!src) { console.log(`${g.slug}: gorsel bulunamadi`); continue; }
    // URL'i OLDUGU GIBI kullan — CDN imzali parametreler tasiyor, degistirince 404 veriyor
    const url = src;
    const ir = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0' } });
    if (!ir.ok) { console.log(`${g.slug}: indirilemedi ${ir.status}`); continue; }
    const ct = ir.headers.get('content-type') || 'image/png';
    if (!ct.startsWith('image/')) { console.log(`${g.slug}: gorsel degil (${ct})`); continue; }
    const buf = Buffer.from(await ir.arrayBuffer());
    if (buf.length < 500) { console.log(`${g.slug}: dosya cok kucuk (${buf.length}B), supheli`); continue; }
    const ext = ct.includes('jpeg') ? 'jpg' : ct.includes('webp') ? 'webp' : 'png';
    const key = `icon/${createHash('sha256').update(buf).digest('hex').slice(0,16)}.${ext}`;
    if (!APPLY) { console.log(`${g.slug.padEnd(11)} HAZIR ${ct} ${(buf.length/1024).toFixed(0)}KB -> ${key}`); continue; }
    const { url: blobUrl } = await put(key, buf, { access: 'public', contentType: ct, token: process.env.BLOB_READ_WRITE_TOKEN, addRandomSuffix: false, allowOverwrite: true });
    await p.game.update({ where: { slug: g.slug }, data: { iconUrl: blobUrl } });
    console.log(`${g.slug.padEnd(11)} YAZILDI -> ${blobUrl}`);
  } catch (e) { console.log(`${g.slug}: HATA ${String(e).slice(0,70)}`); }
}
await p.$disconnect();
