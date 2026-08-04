'use client';
import { useEffect } from 'react';
import Link from 'next/link';

// Hata sınırı. Bir sayfa render sırasında patlarsa Next varsayılan olarak boş bir
// ekran gösteriyor; kullanıcı ne olduğunu anlamıyor ve siteyi terk ediyor.
// Burada en azından "tekrar dene" ve çıkış yolu veriyoruz.
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
      <div className="text-5xl">📡</div>
      <h1 className="mt-4 text-2xl font-black text-ink">Signal lost</h1>
      <p className="mt-2 text-sm text-dim">
        Something broke while loading this page. It&apos;s usually temporary — try again.
      </p>
      {error.digest && <p className="mono mt-2 text-[11px] text-faint">ref: {error.digest}</p>}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button onClick={reset} className="btn-acc-fx">Try again</button>
        <Link href="/" className="btn-ghost">Back to home</Link>
      </div>
    </div>
  );
}
