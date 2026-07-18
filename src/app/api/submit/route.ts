import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const clean = (v: unknown, max = 400) => String(v ?? '').trim().slice(0, max);

function slugify(name: string): string {
  return (
    name.toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) ||
    'game'
  );
}

// data:image (≤256KB) veya http(s) URL kabul; aksi halde boş.
function cleanImage(raw: string): string | null {
  const v = raw.trim();
  if (/^data:image\/(png|jpe?g|webp|gif|svg\+xml);base64,/i.test(v)) return v.length <= 256 * 1024 ? v : null;
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

  const icon = cleanImage(String(body.iconUrl ?? ''));
  if (icon === null) return NextResponse.json({ error: 'Icon must be under 200KB.' }, { status: 400 });
  const tokenAddress = clean(body.tokenAddress, 64) || null;

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
      iconUrl: icon || null,
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
