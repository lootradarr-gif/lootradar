import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { ADMIN_COOKIE, verifySession } from '@/lib/admin-auth';

function authed() {
  return verifySession(cookies().get(ADMIN_COOKIE)?.value);
}

// PATCH: oyunu güncelle (onay/red/featured/alan düzenleme). DELETE: sil.
export async function PATCH(req: Request) {
  if (!authed()) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const id = String(body.id || '');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const data: Record<string, unknown> = {};
  const str = (k: string, max = 500) => { if (typeof body[k] === 'string') data[k] = body[k].trim().slice(0, max); };
  const int = (k: string) => { if (body[k] != null && body[k] !== '') data[k] = Math.max(0, Math.round(Number(body[k]))); };
  const num = (k: string) => { if (body[k] != null && body[k] !== '') data[k] = Number(body[k]); };

  if (['PENDING', 'APPROVED', 'REJECTED'].includes(body.reviewStatus)) data.reviewStatus = body.reviewStatus;
  if (['MAINNET', 'TGE', 'BETA', 'PRE_TOKEN'].includes(body.status)) data.status = body.status;
  if (typeof body.featured === 'boolean') data.featured = body.featured;
  int('sortWeight'); str('name', 80); str('ticker', 20); str('genre', 40); str('desc', 300);
  str('tokenAddress', 64); str('x', 200); str('site', 200); str('icon', 8);
  if (typeof body.iconUrl === 'string') data.iconUrl = body.iconUrl.slice(0, 300000) || null;
  if (typeof body.bannerUrl === 'string') data.bannerUrl = body.bannerUrl.slice(0, 500000) || null;
  int('playersOnline'); int('holders'); int('rating');
  num('mockPrice'); num('mockMcap'); num('mockVol24h'); num('mockChange24h');

  if (typeof data.ticker === 'string') data.ticker = (data.ticker as string).replace(/^\$/, '');
  const game = await prisma.game.update({ where: { id }, data });
  return NextResponse.json({ ok: true, game });
}

export async function DELETE(req: Request) {
  if (!authed()) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await req.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  await prisma.game.delete({ where: { id: String(id) } });
  return NextResponse.json({ ok: true });
}
