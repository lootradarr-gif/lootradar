import { NextResponse } from 'next/server';
import { fetchOnline } from '@/lib/online';

export const dynamic = 'force-dynamic';

// GET /api/online-check?url=... — oyun sahibi form doldururken kendi "canlı oyuncu" endpoint'ini test eder.
export async function GET(req: Request) {
  const url = new URL(req.url).searchParams.get('url') || '';
  if (!/^https?:\/\//i.test(url)) {
    return NextResponse.json({ ok: false, error: 'Enter a valid http(s) URL.' }, { status: 400 });
  }
  const online = await fetchOnline(url);
  if (online === null) {
    return NextResponse.json({ ok: false, error: 'Could not read a player count. Endpoint must return a number or JSON like {"online": 123}.' });
  }
  return NextResponse.json({ ok: true, online });
}
