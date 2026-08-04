import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { BOOST_TREASURY, BURN_ADDRESS, getTier } from '@/lib/boost';
import { verifySplitTokenPayment } from '@/lib/spl-verify';
import { verifyQuote, type QuotePayload } from '@/lib/boost-quote';
import { LOOT, lootLive } from '@/lib/token';
import { rawToLoot } from '@/lib/loot-price';

// Boost ödemesi artık SOL değil $LOOT ile, ve TEK tx içinde İKİYE bölünmüş:
// yarısı treasury'ye, yarısı yakma adresine. İkisi de zincirde doğrulanır — "yarısı
// yakılıyor" bir vaat değil, ödemenin kendisine yazılmış bir olgu.
export async function POST(req: Request) {
  if (!lootLive()) return NextResponse.json({ error: 'Token not live yet' }, { status: 503 });

  const body = await req.json().catch(() => ({}));
  const signature = String(body.signature || '').trim();
  const payerWallet = String(body.payerWallet || '').trim();
  const quote = body.quote as QuotePayload | undefined;
  const quoteSig = String(body.quoteSignature || '');

  if (!signature || signature.length < 32) return NextResponse.json({ error: 'Missing transaction' }, { status: 400 });
  if (!payerWallet || payerWallet.length < 32) return NextResponse.json({ error: 'Missing wallet' }, { status: 400 });
  if (!quote) return NextResponse.json({ error: 'Missing quote' }, { status: 400 });

  // TEKLİF DOĞRULAMA — tutar sunucudan geldi ve imzalı, istemci düşüremez.
  const qv = verifyQuote(quote, quoteSig);
  if (!qv.ok) return NextResponse.json({ error: `Quote invalid (${qv.reason})` }, { status: 400 });

  const tier = getTier(quote.tierId);
  if (!tier) return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });

  const game = await prisma.game.findUnique({ where: { id: quote.gameId }, select: { id: true, reviewStatus: true, featuredUntil: true } });
  if (!game) return NextResponse.json({ error: 'Game not found' }, { status: 404 });
  if (game.reviewStatus !== 'APPROVED') return NextResponse.json({ error: 'Game is not live yet (pending review)' }, { status: 400 });

  // replay koruması — aynı tx iki boost'a sayılamaz
  const existing = await prisma.boost.findUnique({ where: { txSignature: signature } });
  if (existing) return NextResponse.json({ error: 'This transaction was already used' }, { status: 409 });

  // ── ON-CHAIN DOĞRULAMA (bölünmüş ödeme) ──
  const need = { treasury: BigInt(quote.treasury), burn: BigInt(quote.burn) };
  const check = await verifySplitTokenPayment(
    signature, payerWallet, BOOST_TREASURY, BURN_ADDRESS, LOOT.mint, need.treasury, need.burn,
  );
  if (!check.ok) return NextResponse.json({ error: `Payment not verified (${check.reason})` }, { status: 402 });

  // süreyi uzat: zaten boost'luysa mevcut bitişin üstüne ekle
  const base = game.featuredUntil && game.featuredUntil > new Date() ? game.featuredUntil : new Date();
  const until = new Date(base.getTime() + tier.days * 86_400_000);
  const totalLoot = rawToLoot(need.treasury + need.burn);

  try {
    await prisma.$transaction([
      prisma.boost.create({
        data: {
          gameId: game.id, bidderWallet: payerWallet, bidSolPer1k: 0,
          // ⚠️ paidSol alanı artık ÖDENEN LOOT'u tutuyor (şema adı eski, anlamı yeni).
          impressions: 0, paidSol: totalLoot, status: 'LIVE',
          txSignature: signature, activatedAt: new Date(), endedAt: until,
        },
      }),
      prisma.game.update({ where: { id: game.id }, data: { featured: true, featuredUntil: until } }),
    ]);
  } catch {
    return NextResponse.json({ error: 'This transaction was already used' }, { status: 409 });
  }

  return NextResponse.json({
    ok: true, featuredUntil: until.toISOString(), days: tier.days,
    paidLoot: totalLoot, burnedLoot: rawToLoot(need.burn),
  });
}
