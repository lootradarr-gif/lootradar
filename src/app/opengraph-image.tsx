import { ImageResponse } from 'next/og';

// X/Telegram/Discord link önizleme kartı (1200×630). Vercel/Linux'ta üretilir.
export const runtime = 'edge';
export const alt = 'LootRadar — Discover Solana Games';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const ring = (s: number, o: number) => ({
  position: 'absolute' as const, width: s, height: s, borderRadius: s,
  border: `2px solid rgba(61,139,255,${o})`, right: Math.round(-s * 0.32), top: Math.round(315 - s / 2),
  display: 'flex',
});

export default function OG() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', background: 'linear-gradient(135deg,#0b0d12 0%,#0a0b0d 55%,#0c1626 100%)', position: 'relative', overflow: 'hidden' }}>
        {/* radar halkaları */}
        <div style={ring(760, 0.09)} />
        <div style={ring(560, 0.13)} />
        <div style={ring(370, 0.20)} />
        <div style={ring(190, 0.32)} />
        {/* blip'ler */}
        <div style={{ position: 'absolute', right: 270, top: 200, width: 20, height: 20, borderRadius: 20, background: '#3d8bff', display: 'flex' }} />
        <div style={{ position: 'absolute', right: 150, top: 370, width: 14, height: 14, borderRadius: 14, background: '#22e0a8', display: 'flex' }} />
        <div style={{ position: 'absolute', right: 380, top: 430, width: 12, height: 12, borderRadius: 12, background: '#ffcb45', display: 'flex' }} />

        {/* içerik */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 84px', gap: 22, zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ display: 'flex', width: 14, height: 14, borderRadius: 14, background: '#3d8bff' }} />
            <span style={{ color: '#3d8bff', fontSize: 26, fontWeight: 700, letterSpacing: 2 }}>LIVE ON SOLANA</span>
          </div>
          <div style={{ display: 'flex' }}>
            <span style={{ fontSize: 112, fontWeight: 800, color: '#ffffff', letterSpacing: -2 }}>Loot</span>
            <span style={{ fontSize: 112, fontWeight: 800, color: '#3d8bff', letterSpacing: -2 }}>Radar</span>
          </div>
          <span style={{ fontSize: 42, fontWeight: 700, color: '#e8edf4' }}>Every Solana game, one live board.</span>
          <span style={{ fontSize: 28, color: '#9aa4b2' }}>Live prices · player counts · charts · community votes</span>
          <span style={{ marginTop: 16, fontSize: 28, fontWeight: 700, color: '#3d8bff' }}>lootradar.io</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
