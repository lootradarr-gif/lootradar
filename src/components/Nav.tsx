'use client';
import { useState } from 'react';
import Link from 'next/link';
import { AccountButton } from './AccountButton';
import { ThemeToggle } from './ThemeToggle';
import { Zap, Menu, X } from 'lucide-react';

const LINKS = [
  { href: '/', label: 'Explore' },
  { href: '/rankings', label: 'Rankings' },
  { href: '/community', label: 'Community' },
];

export function Nav() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1240px] items-center gap-3 px-3 sm:gap-5 sm:px-6">
        <Link href="/" onClick={close} className="flex shrink-0 items-center gap-2 font-bold tracking-tight">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="LootRadar" width={28} height={28} className="h-7 w-7" />
          <span className="hidden sm:inline">LootRadar<span className="text-acc">.</span></span>
        </Link>

        {/* desktop nav */}
        <nav className="hidden items-center gap-0.5 text-sm sm:flex">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="rounded-full px-3 py-1.5 text-dim transition-colors hover:bg-panel hover:text-ink">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 sm:gap-2.5">
          <ThemeToggle />
          <Link href="/boost" className="hidden items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold text-gold transition-colors hover:bg-panel sm:inline-flex"><Zap size={15} /> Boost</Link>
          <Link href="/submit" className="btn-ghost btn-sm hidden sm:inline-flex">List your game</Link>
          <AccountButton />
          {/* mobile hamburger */}
          <button onClick={() => setOpen((v) => !v)} aria-label="Menu"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line text-ink sm:hidden">
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* mobile menu */}
      {open && (
        <div className="border-t border-line bg-bg px-3 py-2 sm:hidden">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} onClick={close} className="block rounded-lg px-3 py-2.5 text-sm font-medium text-dim hover:bg-panel hover:text-ink">
              {l.label}
            </Link>
          ))}
          <div className="my-1 border-t border-line/60" />
          <Link href="/submit" onClick={close} className="block rounded-lg px-3 py-2.5 text-sm font-medium text-dim hover:bg-panel hover:text-ink">List your game</Link>
          <Link href="/boost" onClick={close} className="block rounded-lg px-3 py-2.5 text-sm font-bold text-gold hover:bg-panel">⚡ Boost your game</Link>
        </div>
      )}
    </header>
  );
}
