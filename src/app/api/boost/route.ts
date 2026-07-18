import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { BOOST_TREASURY, LAMPORTS_PER_SOL, getTier } from '@/lib/boost';
import { verifySolPayment } from '@/lib/solana-verify';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const gameId = String(body.gameId || '');
  const tierId = String(body.tierId || '');
  const signature = String(body.signature || '').trim();
  const payerWallet = String(body.payerWallet || '').trim();

  const tier = getTier(tierId);
  if (!tier) return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
  if (!signature || signature.length < 32) return NextResponse.json({ error: 'Missing transaction' }, { status: 400 });
  if (!payerWallet || payerWallet.length < 32) return NextResponse.json({ error: 'Missing wallet' }, { status: 400 });

  const game = await prisma.game.findUnique({ where: { id: gameId }, select: { id: true, reviewStatus: true, featuredUntil: true } });
  if (!game) return NextResponse.json({ error: 'Game not found' }, { status: 404 });
  if (game.reviewStatus !== 'APPROVED') return NextResponse.json({ error: 'Game is not live yet (pending review)' }, { status: 400 });

  // aynı tx tekrar kullanılamaz (replay koruması)
  const existing = await prisma.boost.findUnique({ where: { txSignature: signature } });
  if (existing) return NextResponse.json({ error: 'This transaction was already used' }, { status: 409 });

  // ── ON-CHAIN DOĞRULAMA ──
  const minLamports = Math.round(tier.sol * LAMPORTS_PER_SOL);
  const check = await verifySolPayment(signature, payerWallet, BOOST_TREASURY, minLamports);
  if (!check.ok) return NextResponse.json({ error: `Payment not verified (${check.reason})` }, { status: 402 });

  // süreyi uzat: zaten boost'luysa mevcut bitişin üstüne ekle, değilse şimdiden
  const base = game.featuredUntil && game.featuredUntil > new Date() ? game.featuredUntil : new Date();
  const until = new Date(base.getTime() + tier.days * 86_400_000);

  try {
    await prisma.$transaction([
      prisma.boost.create({
        data: {
          gameId: game.id, bidderWallet: payerWallet, bidSolPer1k: 0,
          impressions: 0, paidSol: tier.sol, status: 'LIVE',
          txSignature: signature, activatedAt: new Date(), endedAt: until,
        },
      }),
      prisma.game.update({ where: { id: game.id }, data: { featured: true, featuredUntil: until } }),
    ]);
  } catch {
    return NextResponse.json({ error: 'This transaction was already used' }, { status: 409 });
  }

  return NextResponse.json({ ok: true, featuredUntil: until.toISOString(), days: tier.days });
}
