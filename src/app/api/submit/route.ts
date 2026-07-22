import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { moderate } from '@/lib/moderation';
import { persistImage } from '@/lib/blob';

const clean = (v: unknown, max = 400) => String(v ?? '').trim().slice(0, max);

function slugify(name: string): string {
  return (
    name.toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) ||
    'game'
  );
}

// data:image (≤maxKB) veya http(s) URL kabul; null = çok büyük (400 döndür); '' = geçersiz/yok.
// ÖNEMLİ: base64 string ~%37 şişer — GERÇEK çözülmüş byte boyutunu ölç (client'ın f.size'ıyla aynı).
function cleanImage(raw: string, maxKB: number): string | null {
  const v = raw.trim();
  if (/^data:image\/(png|jpe?g|webp|gif|svg\+xml);base64,/i.test(v)) {
    const b64 = v.slice(v.indexOf(',') + 1);
    const bytes = Math.floor((b64.length * 3) / 4); // base64 → çözülmüş byte
    return bytes <= maxKB * 1024 ? v : null;
  }
  if (/^https?:\/\//i.test(v)) return v.slice(0, 500);
  return '';
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const name = clean(body.name, 80);
  const site = clean(body.site, 200);
  const desc = clean(body.desc, 200);
  const contact = clean(body.contact, 120);
  const genre = clean(body.genre, 40);
  const submitterWallet = clean(body.submitterWallet, 64);

  if (!submitterWallet || submitterWallet.length < 32) {
    return NextResponse.json({ error: 'Connect your wallet first.' }, { status: 401 });
  }
  if (!name || !site || !desc || !contact || !genre) {
    return NextResponse.json({ error: 'Please fill in all required fields.' }, { status: 400 });
  }
  if (!/^https?:\/\//i.test(site)) {
    return NextResponse.json({ error: 'Website must be a valid URL.' }, { status: 400 });
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contact)) {
    return NextResponse.json({ error: 'Please enter a valid contact email.' }, { status: 400 });
  }

  const icon = cleanImage(String(body.iconUrl ?? ''), 300);
  if (icon === null) return NextResponse.json({ error: 'Icon must be under 300KB.' }, { status: 400 });
  const banner = cleanImage(String(body.bannerUrl ?? ''), 400);
  if (banner === null) return NextResponse.json({ error: 'Banner must be under 400KB.' }, { status: 400 });
  const tokenAddress = clean(body.tokenAddress, 64) || null;

  // Overview / About — moderasyon (scam/CA/link engeli)
  const about = clean(body.about, 1200);
  if (about) {
    // sahip başvurusu + admin onaylı → kendi token adresini/linkini yazabilir; scam kalıbı + küfür yine engelli
    const mod = moderate(about, { allowAddresses: true, allowLinks: true });
    if (!mod.ok) return NextResponse.json({ error: `Overview: ${mod.reason}` }, { status: 400 });
  }
  // Screenshots (maks 3, her biri ≤400KB veya http)
  const screenshots: string[] = [];
  for (const raw of Array.isArray(body.screenshots) ? body.screenshots.slice(0, 3) : []) {
    const s = cleanImage(String(raw ?? ''), 400);
    if (s === null) return NextResponse.json({ error: 'Each screenshot must be under 400KB.' }, { status: 400 });
    if (s) screenshots.push(s);
  }
  // Online API URL (opsiyonel, http(s))
  const rawOnline = clean(body.onlineApiUrl, 300);
  const onlineApiUrl = rawOnline && /^https?:\/\//i.test(rawOnline) ? rawOnline : null;

  const urlOrNull = (v: unknown) => { const s = clean(v, 200); return s && /^https?:\/\//i.test(s) ? s : null; };
  const discord = urlOrNull(body.discord);
  const telegram = urlOrNull(body.telegram);
  const ALLOWED_PLATFORMS = ['Web', 'iOS', 'Android', 'Windows', 'Mac'];
  const platforms = (Array.isArray(body.platforms) ? body.platforms : []).map((p: unknown) => String(p)).filter((p: string) => ALLOWED_PLATFORMS.includes(p)).slice(0, 5);

  // Görselleri Vercel Blob'a taşı (data-URI'leri DB'ye/HTML'e gömmeyi bırak — sayfa şişmesin)
  let iconUrl: string | null, bannerUrl: string | null, shotUrls: string[];
  try {
    iconUrl = await persistImage(icon, 'games/icons');
    bannerUrl = await persistImage(banner, 'games/banners');
    shotUrls = (await Promise.all(screenshots.map((s) => persistImage(s, 'games/shots')))).filter((u): u is string => !!u);
  } catch (e) {
    console.error('[submit] blob upload failed:', (e as Error).message);
    return NextResponse.json({ error: 'Image upload failed, please try again.' }, { status: 502 });
  }

  // benzersiz slug
  let slug = slugify(name);
  if (await prisma.game.findUnique({ where: { slug } })) {
    slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
  }

  const game = await prisma.game.create({
    data: {
      slug,
      name,
      ticker: clean(body.ticker, 20).replace(/^\$/, ''),
      genre,
      desc,
      about,
      screenshots: shotUrls,
      onlineApiUrl,
      discord,
      telegram,
      platforms,
      iconUrl,
      bannerUrl,
      tokenAddress,
      status: tokenAddress ? 'MAINNET' : 'PRE_TOKEN',
      x: clean(body.x, 200) || null,
      site,
      contact,
      submitterWallet,
      reviewStatus: 'PENDING',
    },
    select: { id: true, slug: true },
  });

  return NextResponse.json({ ok: true, id: game.id, slug: game.slug });
}
