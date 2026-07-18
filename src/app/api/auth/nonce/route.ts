import { NextResponse } from 'next/server';
import { makeNonce } from '@/lib/user-auth';

// KRİTİK: her istekte TAZE nonce üretilmeli. Next.js GET route'ları varsayılan cache'ler →
// force-dynamic + no-store ile cache KAPALI (yoksa herkese aynı bayat nonce → "Nonce expired").
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  return NextResponse.json(
    { nonce: makeNonce() },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } },
  );
}
