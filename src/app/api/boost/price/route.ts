import { NextResponse } from 'next/server';
import { lootPriceUsd } from '@/lib/loot-price';

export const dynamic = 'force-dynamic';

// Canlı $LOOT fiyatı — boost kartlarının LOOT tutarını göstermesi için.
// ⚠️ Ödeme tutarı BURADAN gelmez; o /api/boost/quote'tan İMZALI gelir. Buradaki değer
// sadece gösterim; istemci fiyatı değiştirse bile ödenecek tutarı etkileyemez.
export async function GET() {
  return NextResponse.json({ priceUsd: await lootPriceUsd() });
}
