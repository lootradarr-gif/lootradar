import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Nav } from '@/components/Nav';
import { Ticker } from '@/components/Ticker';
import { EVENTS } from '@/lib/feed';

const sans = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });

export const metadata: Metadata = {
  title: 'LootRadar — The Web3 Game Radar',
  description: 'Discover, track and rank on-chain games — live token markets, real players, real economies. Starting on Solana.',
  icons: { icon: '/logo.svg', shortcut: '/logo.svg', apple: '/logo.svg' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body className="min-h-screen bg-bg font-sans text-ink antialiased">
        <Nav />
        <Ticker items={EVENTS.slice(0, 8).map((e) => ({ text: `${e.title}`, tag: e.game, at: e.at }))} />
        <main className="mx-auto w-full max-w-[1240px] px-4 pb-24 sm:px-6">{children}</main>
        <footer className="mx-auto max-w-[1240px] border-t border-line px-4 py-10 text-sm text-faint sm:px-6">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 font-semibold text-dim">
              <span className="text-acc">◆</span> LootRadar
              <span className="text-faint">— the Web3 game radar</span>
            </div>
            <div className="flex flex-wrap gap-5">
              <a className="hover:text-dim" href="/rankings">Rankings</a>
              <a className="hover:text-dim" href="/feed">Feed</a>
              <a className="hover:text-dim" href="/submit">Submit a game</a>
              <a className="hover:text-dim" href="/boost">Boost</a>
            </div>
          </div>
          <p className="mt-6 text-xs text-faint">Market data via DexScreener. Not financial advice. Player counts are self-reported by projects.</p>
        </footer>
      </body>
    </html>
  );
}
