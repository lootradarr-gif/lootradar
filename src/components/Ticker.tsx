// Üst canlı haber şeridi — kayan (CSS animation, JS yok). İçerik 2x kopyalanır → kesintisiz döngü.
export function Ticker({ items }: { items: { text: string; tag: string; at: number }[] }) {
  if (!items.length) return null;
  const row = [...items, ...items];
  return (
    <div className="overflow-hidden border-b border-line bg-panel/60">
      <div className="flex w-max animate-ticker items-center gap-8 py-2 pl-4 text-xs">
        <span className="flex shrink-0 items-center gap-1.5 font-semibold text-acc">
          <span className="h-1.5 w-1.5 animate-pulse2 rounded-full bg-acc" /> LIVE
        </span>
        {row.map((it, i) => (
          <span key={i} className="flex shrink-0 items-center gap-2 text-dim">
            <span className="text-ink">{it.text}</span>
            <span className="text-faint">·</span>
            <span className="text-faint">{it.tag}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
