// Oyun ikonu — proje logosu (iconUrl) varsa onu, yoksa emoji fallback'i gösterir.
// Tek yerde toplandı ki kart/tablo/detay hepsi tutarlı olsun.
export function GameIcon({
  g,
  className = 'h-11 w-11 rounded-xl text-xl',
}: {
  g: { icon: string; iconUrl?: string; name: string };
  className?: string;
}) {
  return (
    <span className={`grid shrink-0 place-items-center overflow-hidden border border-line bg-panel2 ${className}`}>
      {g.iconUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={g.iconUrl} alt={g.name} className="h-full w-full object-cover" />
      ) : (
        g.icon
      )}
    </span>
  );
}
