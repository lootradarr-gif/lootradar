/* Mevcut oyunların base64 data-URI görsellerini (iconUrl/bannerUrl/screenshots)
   Vercel Blob'a taşır ve DB'yi kısa URL'lerle günceller. İçerik-hash anahtarı → idempotent,
   tekrar çalıştırmak güvenli. Çalıştır:
   node --env-file=.env.local node_modules/tsx/dist/cli.mjs scripts/migrate-images-to-blob.ts */
import { PrismaClient } from '@prisma/client';
import { persistImage, isDataUri } from '../src/lib/blob';

const prisma = new PrismaClient();

async function main() {
  const games = await prisma.game.findMany({
    select: { id: true, slug: true, iconUrl: true, bannerUrl: true, screenshots: true },
  });
  console.log(`${games.length} oyun taranıyor...`);
  let changed = 0, uploads = 0;

  for (const g of games) {
    const data: { iconUrl?: string | null; bannerUrl?: string | null; screenshots?: string[] } = {};

    if (isDataUri(g.iconUrl)) { data.iconUrl = await persistImage(g.iconUrl, 'games/icons'); uploads++; }
    if (isDataUri(g.bannerUrl)) { data.bannerUrl = await persistImage(g.bannerUrl, 'games/banners'); uploads++; }

    const shots = g.screenshots || [];
    if (shots.some(isDataUri)) {
      data.screenshots = [];
      for (const s of shots) {
        if (isDataUri(s)) { const u = await persistImage(s, 'games/shots'); uploads++; if (u) data.screenshots.push(u); }
        else if (s) data.screenshots.push(s);
      }
    }

    if (Object.keys(data).length) {
      await prisma.game.update({ where: { id: g.id }, data });
      changed++;
      console.log(`  ✓ ${g.slug} → ${Object.keys(data).join(', ')}`);
    }
  }
  console.log(`\nBitti: ${changed} oyun güncellendi, ${uploads} görsel Blob'a yüklendi.`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
