import { NextResponse } from 'next/server';
import { addSubmission } from '@/lib/submissions';

const clean = (v: unknown, max = 400) => String(v ?? '').trim().slice(0, max);

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

  if (!name || !site || !desc || !contact || !genre) {
    return NextResponse.json({ error: 'Please fill in all required fields.' }, { status: 400 });
  }
  if (!/^https?:\/\//i.test(site)) {
    return NextResponse.json({ error: 'Website must be a valid URL.' }, { status: 400 });
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contact)) {
    return NextResponse.json({ error: 'Please enter a valid contact email.' }, { status: 400 });
  }

  const tier = ['free', 'boost', 'featured'].includes(clean(body.tier)) ? clean(body.tier) : 'free';

  // ikon: data:image/... (≤256KB) veya http(s) URL — aksi halde yok sayılır
  const rawIcon = String(body.iconUrl ?? '').trim();
  let iconUrl = '';
  if (/^data:image\/(png|jpe?g|webp|gif|svg\+xml);base64,/i.test(rawIcon)) {
    if (rawIcon.length <= 256 * 1024) iconUrl = rawIcon;
    else return NextResponse.json({ error: 'Icon must be under 200KB.' }, { status: 400 });
  } else if (/^https?:\/\//i.test(rawIcon)) {
    iconUrl = rawIcon.slice(0, 400);
  }

  const row = await addSubmission({
    name,
    ticker: clean(body.ticker, 20).replace(/^\$/, ''),
    genre,
    tokenAddress: clean(body.tokenAddress, 64),
    iconUrl,
    site,
    x: clean(body.x, 200),
    desc,
    contact,
    tier,
  });

  return NextResponse.json({ ok: true, id: row.id });
}
