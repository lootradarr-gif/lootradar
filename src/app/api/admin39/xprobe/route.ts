import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE, verifySession } from '@/lib/admin-auth';
import { fetchTweet, tweetIdFrom, checkShare } from '@/lib/x-verify';

// X DOĞRULAMA TEŞHİSİ — admin korumalı.
//
// İki işe yarıyor:
//   1. Dağıtım sonrası kontrol: X'in syndication ucu Vercel'in veri merkezi IP'lerinden
//      erişilebilir mi? (Bazı CDN'ler DC IP'lerini kısıtlar; erişilemezse tüm X→XP
//      akışı sessizce ölür ve bunu ancak kullanıcı şikayetinden öğreniriz.)
//   2. Destek: "gönderim doğrulanmıyor" diyen oyuncunun linkini burada çalıştırıp
//      hangi kuralda takıldığını tam olarak görmek.
//
// GET /api/admin39/xprobe?url=<tweet linki>   (url yoksa bilinen kalıcı bir tweet denenir)
export async function GET(req: Request) {
  if (!verifySession(cookies().get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const url = new URL(req.url).searchParams.get('url') || '';
  const id = url ? tweetIdFrom(url) : '20';   // '20' = X'in ilk tweet'i, kalıcı sağlık göstergesi
  if (!id) return NextResponse.json({ error: 'bad_url' }, { status: 400 });

  const t0 = Date.now();
  const t = await fetchTweet(id);
  const ms = Date.now() - t0;

  if (!t) return NextResponse.json({ reachable: false, id, ms, note: 'Syndication endpoint returned nothing — X may be blocking this host.' });

  return NextResponse.json({
    reachable: true, ms, id: t.id, handle: t.handle, name: t.name,
    createdAt: t.createdAt.toISOString(),
    text: t.text.slice(0, 280),
    shareCheck: checkShare(t),
  });
}
