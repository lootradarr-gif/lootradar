import { ImageResponse } from 'next/og';
import { prisma } from '@/lib/prisma';
import { fetchMarkets } from '@/lib/dexscreener';
import { price, usd, pct, compact } from '@/lib/format';

// Her oyun için dinamik paylaşım kartı (1200×630). Node runtime (prisma edge'de çalışmaz).
// Dinamik route → build'de prerender EDİLMEZ, istekte üretilir. Vercel/Linux'ta çalışır.
export const alt = 'Game on LootRadar';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const ORIGIN = 'https://lootradar.io';
// satori (next/og) SADECE PNG/JPEG raster'ı güvenle işler — WEBP/GIF/AVIF data URL crash ettirir.
// data URL'i mime'e göre süz; desteklenmeyen → '' (bileşen fallback'e düşer).
const ogImg = (u?: string | null): string => {
  if (!u) return '';
  if (/^data:image\/(png|jpe?g);base64,/i.test(u)) return u;
  if (/^data:/i.test(u)) return '';                 // webp/svg/gif/avif data → atla
  if (/^https?:\/\//i.test(u)) return u;             // uzak logo (genelde png/jpg)
  return `${ORIGIN}${u}`;                             // /games/*.png
};

const ACCENT = '#3d8bff', UP = '#22e0a8', DOWN = '#ff5d73', GOLD = '#ffcb45', BG = '#0a0b0d', DIM = '#9aa4b2', FAINT = '#6b7686';

export default async function Image({ params }: { params: { id: string } }) {
  const g = await prisma.game.findUnique({
    where: { slug: params.id },
    select: {
      name: true, ticker: true, genre: true, status: true, bannerUrl: true, iconUrl: true,
      verified: true, featured: true, featuredUntil: true, tokenAddress: true,
      playersOnline: true, voteCount: true, mockPrice: true, mockMcap: true, mockChange24h: true,
    },
  });
  if (!g) {
    return new ImageResponse((<div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: BG, color: '#fff', fontSize: 48 }}>LootRadar</div>), { ...size });
  }

  const noToken = !g.tokenAddress;
  let priceV = g.mockPrice ?? 0, mcapV = g.mockMcap ?? 0, changeV = g.mockChange24h ?? 0, dexImg = '';
  if (g.tokenAddress) {
    try {
      const m = await fetchMarkets([g.tokenAddress]);
      const t = m[g.tokenAddress];
      if (t) {
        priceV = t.priceUsd; mcapV = t.marketCap; changeV = t.change24h;
        // DexScreener CDN 'format=auto' → satori'ye WEBP servis edebilir; PNG'ye zorla
        if (t.imageUrl) dexImg = t.imageUrl.replace(/format=auto/i, 'format=png');
      }
    } catch { /* mock kalır */ }
  }
  const boosted = g.featured && (!g.featuredUntil || g.featuredUntil > new Date());
  const up = changeV >= 0;
  const banner = ogImg(g.bannerUrl);
  const icon = ogImg(g.iconUrl) || ogImg(dexImg);   // DB icon yoksa DexScreener logosu

  const stats: { label: string; value: string; color?: string }[] = [
    { label: 'PRICE', value: noToken ? '—' : price(priceV) },
    { label: '24H', value: noToken ? '—' : pct(changeV), color: noToken ? undefined : up ? UP : DOWN },
    { label: 'MCAP', value: noToken ? '—' : usd(mcapV) },
    { label: 'ONLINE', value: g.playersOnline > 0 ? g.playersOnline.toLocaleString() : '—', color: g.playersOnline > 0 ? UP : undefined },
  ];

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative', background: BG, fontFamily: 'sans-serif' }}>
        {/* banner zemin */}
        {banner
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={banner} alt="" width={1200} height={630} style={{ position: 'absolute', inset: 0, zIndex: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ position: 'absolute', inset: 0, zIndex: 0, background: `linear-gradient(to bottom right, #12203a 0%, ${BG} 70%)` }} />}
        {/* karartma — banner img'in ÜSTÜNE (zIndex 1 şart; satori aksi halde altına çizer). yön-anahtarı gradient (açı DEĞİL) */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1, background: 'rgba(6,8,12,0.4)' }} />
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1, background: 'linear-gradient(to right, rgba(6,8,12,0.96) 0%, rgba(6,8,12,0.82) 46%, rgba(6,8,12,0.2) 100%)' }} />
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1, background: 'linear-gradient(to top, rgba(6,8,12,0.92) 0%, rgba(6,8,12,0.28) 46%, rgba(6,8,12,0) 76%)' }} />
        {/* radar halkaları (sağ-üst) */}
        {[520, 380, 250, 130].map((s, i) => (
          <div key={s} style={{ position: 'absolute', width: s, height: s, borderRadius: s, border: `2px solid rgba(61,139,255,${0.10 + i * 0.05})`, right: Math.round(-s * 0.28), top: Math.round(-s * 0.28), display: 'flex' }} />
        ))}

        {/* içerik */}
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: '100%', height: '100%', padding: 56 }}>
          {/* üst şerit */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://lootradar.io/logo-og.png" width={40} height={40} alt="" style={{ width: 40, height: 40 }} />
              <span style={{ fontSize: 30, fontWeight: 800, color: '#fff', textShadow: '0 2px 10px rgba(0,0,0,0.85)' }}>LootRadar</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {g.verified && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#181a22', color: '#eef1f6', fontSize: 20, fontWeight: 700, padding: '5px 16px 5px 7px', borderRadius: 999, border: '1px solid rgba(61,139,255,0.35)' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="https://lootradar.io/verified-og.png" width={28} height={28} alt="" style={{ width: 28, height: 28 }} /> Verified
                </span>
              )}
              {boosted && <span style={{ display: 'flex', background: GOLD, color: '#1a1200', fontSize: 20, fontWeight: 800, padding: '6px 14px', borderRadius: 999 }}>★ BOOSTED</span>}
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#181a22', color: '#dfe6ef', fontSize: 20, fontWeight: 700, padding: '6px 14px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.12)' }}>
                <span style={{ display: 'flex', width: 10, height: 10, borderRadius: 10, background: UP }} /> LIVE ON SOLANA
              </span>
            </div>
          </div>

          {/* alt blok */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              {icon
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={icon} alt="" width={104} height={104} style={{ width: 104, height: 104, borderRadius: 26, objectFit: 'cover', border: '2px solid rgba(61,139,255,0.5)' }} />
                : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 104, height: 104, borderRadius: 26, background: '#182338', color: ACCENT, fontSize: 48, fontWeight: 800, border: '2px solid rgba(61,139,255,0.5)' }}>{(g.ticker || g.name).slice(0, 1).toUpperCase()}</div>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
                  <span style={{ fontSize: 66, fontWeight: 800, color: '#fff', letterSpacing: -1, textShadow: '0 3px 14px rgba(0,0,0,0.9)' }}>{g.name}</span>
                  {g.ticker ? <span style={{ fontSize: 34, fontWeight: 700, color: ACCENT, textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>${g.ticker}</span> : null}
                </div>
                <span style={{ fontSize: 24, color: '#c4ccd6', textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>{g.genre} · {g.status} · Solana</span>
              </div>
            </div>

            {/* istatistik şeridi */}
            <div style={{ display: 'flex', background: '#14161d', border: '1px solid #252833', borderRadius: 18, overflow: 'hidden' }}>
              {stats.map((s, i) => (
                <div key={s.label} style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, padding: '20px 26px', borderLeft: i ? '1px solid #252833' : 'none' }}>
                  <span style={{ fontSize: 17, fontWeight: 700, color: FAINT, letterSpacing: 1 }}>{s.label}</span>
                  <span style={{ fontSize: 32, fontWeight: 800, color: s.color ?? '#fff' }}>{s.value}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <span style={{ fontSize: 24, fontWeight: 700, color: ACCENT }}>lootradar.io/game/{params.id}</span>
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
