import Image from 'next/image';
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
        // next/image: token logolari 500KB+ gelebiliyor ama burada en fazla ~44px
        // gosteriliyor. 96px kaynak 2x ekranlara yeter; Next WebP'ye cevirip kucultur.
        <Image src={g.iconUrl} alt={g.name} width={96} height={96} className="h-full w-full object-cover" unoptimized={false} />
      ) : (
        g.icon
      )}
    </span>
  );
}
