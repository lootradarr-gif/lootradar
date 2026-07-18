// Kullanıcı avatarı — resim veya baş harf.
export function Avatar({ name, url, className = 'h-9 w-9 text-sm' }: { name: string; url?: string | null; className?: string }) {
  return (
    <span className={`grid shrink-0 place-items-center overflow-hidden rounded-full border border-line bg-panel2 font-bold text-dim ${className}`}>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={name} className="h-full w-full object-cover" />
      ) : (
        name.slice(0, 1).toUpperCase()
      )}
    </span>
  );
}
