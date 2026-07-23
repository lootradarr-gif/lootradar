/* Açıklaması eksik APPROVED oyunların sitesinden ham sinyalleri toplar (title, twitter:description,
   meta description, ilk h1/h2, hero paragraf). ÇIKTIYI okuyup açıklamaları ELLE yazacağız (doğru olsun).
   Çalıştır: node --env-file=.env.local node_modules/tsx/dist/cli.mjs scripts/gather-desc.ts */
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const clean = (s?: string) => (s || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

async function grab(url: string) {
  try {
    const r = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(8000), redirect: 'follow' });
    if (!r.ok) return { err: r.status };
    const h = (await r.text()).slice(0, 250_000);
    const pick = (re: RegExp) => clean(h.match(re)?.[1]);
    return {
      title: pick(/<title[^>]*>([^<]+)<\/title>/i),
      tw: pick(/<meta[^>]+name=["']twitter:description["'][^>]+content=["']([^"']+)["']/i) || pick(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:description["']/i),
      desc: pick(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i),
      h1: pick(/<h1[^>]*>([\s\S]*?)<\/h1>/i),
      h2: pick(/<h2[^>]*>([\s\S]*?)<\/h2>/i),
    };
  } catch (e) { return { err: (e as Error).name }; }
}

async function main() {
  const gs = await prisma.game.findMany({ where: { reviewStatus: 'APPROVED' }, select: { slug: true, name: true, site: true } });
  const missing = gs.filter((g) => true); // hepsi değil — çağıran filtreler; burada site'i olanları çekelim
  const targets = (await prisma.game.findMany({ where: { reviewStatus: 'APPROVED' }, select: { slug: true, name: true, about: true, site: true } }))
    .filter((g) => (!g.about || /— a .* game on Solana\.$/.test(g.about)) && g.site && /^https?:\/\//.test(g.site) && !/tiktok\.com|x\.com\/i\/communities/.test(g.site));
  for (const g of targets) {
    const info = await grab(g.site!); await sleep(150);
    const parts = [info.title, (info as any).tw, (info as any).desc, (info as any).h1, (info as any).h2].filter(Boolean).map((s) => (s as string).slice(0, 120));
    console.log(`\n## ${g.name} (${g.slug}) — ${g.site}`);
    console.log(info.err ? `   [hata: ${info.err}]` : '   ' + (parts.length ? parts.join(' | ') : '(sinyal yok)'));
  }
  await prisma.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
