// Ana sayfa hero'su için dekoratif animasyonlu radar (süpürme + halkalar + blip'ler).
// Saf CSS (transform/opacity) — performanslı. pointer-events yok, arka planda durur.
export function RadarHero() {
  const blips = [
    { top: '30%', left: '58%', c: '#3d8bff', d: '0s' },
    { top: '62%', left: '38%', c: '#22e0a8', d: '0.8s' },
    { top: '46%', left: '70%', c: '#ffcb45', d: '1.6s' },
    { top: '72%', left: '60%', c: '#3d8bff', d: '2.2s' },
  ];
  return (
    <div aria-hidden className="pointer-events-none absolute -right-24 top-1/2 hidden h-[560px] w-[560px] -translate-y-1/2 opacity-[0.55] md:block lg:opacity-70">
      <style>{`
        @keyframes lr-sweep { to { transform: rotate(360deg); } }
        @keyframes lr-blip { 0%,100% { opacity:.25; transform:scale(1); } 50% { opacity:1; transform:scale(1.5); } }
        @keyframes lr-ping { 0% { transform:scale(.4); opacity:.6; } 100% { transform:scale(2.4); opacity:0; } }
      `}</style>
      <div className="relative h-full w-full">
        {/* halkalar */}
        {[100, 74, 48, 24].map((s) => (
          <div key={s} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border"
            style={{ width: `${s}%`, height: `${s}%`, borderColor: 'rgba(61,139,255,0.18)' }} />
        ))}
        {/* artı çizgiler */}
        <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2" style={{ background: 'rgba(61,139,255,0.14)' }} />
        <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2" style={{ background: 'rgba(61,139,255,0.14)' }} />
        {/* dönen süpürme */}
        <div className="absolute inset-0 rounded-full"
          style={{ background: 'conic-gradient(from 0deg, rgba(61,139,255,0) 0deg, rgba(61,139,255,0) 300deg, rgba(61,139,255,0.28) 352deg, rgba(61,139,255,0.55) 360deg)', animation: 'lr-sweep 4.5s linear infinite', maskImage: 'radial-gradient(circle, #000 62%, transparent 63%)', WebkitMaskImage: 'radial-gradient(circle, #000 62%, transparent 63%)' }} />
        {/* merkez */}
        <div className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: '#3d8bff', boxShadow: '0 0 12px #3d8bff' }} />
        {/* blip'ler */}
        {blips.map((b, i) => (
          <div key={i} className="absolute" style={{ top: b.top, left: b.left }}>
            <div className="h-2 w-2 rounded-full" style={{ background: b.c, animation: `lr-blip 3s ease-in-out ${b.d} infinite` }} />
            <div className="absolute inset-0 h-2 w-2 rounded-full" style={{ background: b.c, animation: `lr-ping 3s ease-out ${b.d} infinite` }} />
          </div>
        ))}
      </div>
    </div>
  );
}
