import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTier, splitBoost, BOOST_TREASURY, BURN_ADDRESS, BURN_PCT } from '@/lib/boost';
import { usdToLootRaw, lootPriceUsd, rawToLoot } from '@/lib/loot-price';
import { signQuote, QUOTE_TTL_MS, type QuotePayload } from '@/lib/boost-quote';
import { LOOT, lootLive } from '@/lib/token';

export const dynamic = 'force-dynamic';

// Ödeme öncesi FİYAT KİLİDİ. İstemci burayı çağırır, imzalı tutarı öder, /api/boost
// aynı imzayı doğrular. Arada fiyat oynasa da meşru ödeme reddedilmez.
export async function POST(req: Request) {
  if (!lootLive()) return NextResponse.json({ error: 'Token not live yet' }, { status: 503 });

  const b = await req.json().catch(() => ({}));
  const gameId = String(b.gameId || '');
  const tierId = String(b.tierId || '');

  const tier = getTier(tierId);
  if (!tier) return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });

  const game = await prisma.game.findUnique({ where: { id: gameId }, select: { id: true, reviewStatus: true } });
  if (!game) return NextResponse.json({ error: 'Game not found' }, { status: 404 });
  if (game.reviewStatus !== 'APPROVED') return NextResponse.json({ error: 'Game is not live yet (pending review)' }, { status: 400 });

  const totalRaw = await usdToLootRaw(tier.usd);
  if (totalRaw === null) return NextResponse.json({ error: 'Price feed unavailable, try again shortly' }, { status: 503 });

  const { burn, treasury } = splitBoost(totalRaw);
  const quote: QuotePayload = {
    gameId: game.id, tierId: tier.id,
    treasury: treasury.toString(), burn: burn.toString(),
    exp: Date.now() + QUOTE_TTL_MS,
  };

  return NextResponse.json({
    quote, signature: signQuote(quote),
    // istemcinin göstereceği/kullanacağı bilgiler
    mint: LOOT.mint, decimals: LOOT.decimals,
    treasuryAddress: BOOST_TREASURY, burnAddress: BURN_ADDRESS, burnPct: BURN_PCT,
    totalLoot: rawToLoot(totalRaw), burnLoot: rawToLoot(burn), treasuryLoot: rawToLoot(treasury),
    usd: tier.usd, days: tier.days, priceUsd: await lootPriceUsd(),
    expiresInMs: QUOTE_TTL_MS,
  });
}
