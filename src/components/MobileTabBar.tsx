'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Radar, Trophy, Users, Zap, PlusCircle } from 'lucide-react';

const TABS = [
  { href: '/', label: 'Explore', Icon: Radar, exact: true },
  { href: '/rankings', label: 'Ranks', Icon: Trophy },
  { href: '/community', label: 'Community', Icon: Users },
  { href: '/boost', label: 'Boost', Icon: Zap, gold: true },
  { href: '/submit', label: 'Submit', Icon: PlusCircle },
];

// Mobil uygulama-tarzı alt sekme çubuğu (sadece < sm). Aktif sekme vurgulanır.
export function MobileTabBar() {
  const path = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/95 backdrop-blur sm:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="mx-auto grid max-w-lg grid-cols-5">
        {TABS.map(({ href, label, Icon, exact, gold }) => {
          const active = exact ? path === href : path.startsWith(href);
          const color = active ? (gold ? 'text-gold' : 'text-acc') : 'text-faint';
          return (
            <Link key={href} href={href}
              className={`flex flex-col items-center gap-0.5 py-2 text-[10px] font-semibold transition-colors ${color}`}>
              <Icon size={21} strokeWidth={active ? 2.4 : 2} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
