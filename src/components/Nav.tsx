import Link from 'next/link';
import { WalletButton } from './WalletButton';

const LINKS = [
  { href: '/', label: 'Explore' },
  { href: '/rankings', label: 'Rankings' },
  { href: '/feed', label: 'Pulse' },
  { href: '/community', label: 'Players' },
];

export function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1240px] items-center gap-5 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="LootRadar" width={28} height={28} className="h-7 w-7" />
          <span className="hidden sm:inline">LootRadar<span className="text-acc">.</span></span>
        </Link>
        <nav className="flex items-center gap-0.5 text-sm">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="rounded-full px-3 py-1.5 text-dim transition-colors hover:bg-panel hover:text-ink">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Link href="/boost" className="hidden rounded-full px-3 py-1.5 text-sm font-semibold text-gold transition-colors hover:bg-panel sm:inline-flex">⚡ Boost</Link>
          <Link href="/submit" className="btn-ghost btn-sm hidden sm:inline-flex">List your game</Link>
          <WalletButton compact />
        </div>
      </div>
    </header>
  );
}
