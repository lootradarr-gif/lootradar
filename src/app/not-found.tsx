import Link from 'next/link';

// Markalı 404. Varsayılan Next sayfası çıplak beyaz bir ekran — siteye ilk kez
// gelen biri için "bu site bozuk" izlenimi bırakıyor. Buradan çıkış yolu veriyoruz.
export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
      <div className="mono text-6xl font-black text-line2">404</div>
      <h1 className="mt-4 text-2xl font-black text-ink">Nothing on the radar here</h1>
      <p className="mt-2 text-sm text-dim">
        That page doesn&apos;t exist — it may have been moved, or the game was removed from the directory.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link href="/" className="btn-acc-fx">Back to home</Link>
        <Link href="/rankings" className="btn-ghost">Browse games</Link>
      </div>
    </div>
  );
}
