import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Nav } from '@/components/Nav';
import { MobileTabBar } from '@/components/MobileTabBar';
import { SolanaProvider } from '@/components/WalletProvider';
import { GoogleAnalytics } from '@next/third-parties/google';

// GA4 Measurement ID (public değer — gizli değil). Boşsa GA yüklenmez.
const GA_ID = process.env.NEXT_PUBLIC_GA_ID || 'G-017CYH52TR';

const sans = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL('https://lootradar.io'),
  title: {
    default: 'LootRadar — Discover Solana Games (live prices, players & charts)',
    template: '%s · LootRadar',
  },
  description: 'The live discovery board for Solana games — real-time token prices, market caps, player counts and charts. Find trending play-to-earn games, vote, and follow launches.',
  keywords: ['Solana games', 'play to earn', 'web3 games', 'crypto games', 'P2E', 'Solana P2E', 'GameFi', 'on-chain games'],
  icons: { icon: '/logo.svg', shortcut: '/logo.svg', apple: '/logo.svg' },
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: 'LootRadar',
    title: 'LootRadar — Discover Solana Games',
    description: 'Live token prices, player counts and charts for the whole Solana gaming scene, in one place.',
    url: 'https://lootradar.io',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@LootRadario',
    creator: '@LootRadario',
    title: 'LootRadar — Discover Solana Games',
    description: 'Live token prices, player counts and charts for Solana games. Find the runners early.',
  },
  verification: { google: 'Qt1Q-fv5Df08fsaqamHq6ngDWlcpo7bwxFTOSOfBq9E' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body className="min-h-screen bg-bg font-sans text-ink antialiased">
        {/* tema flash'ını önle: paint'ten önce html.light sınıfını uygula */}
        <script dangerouslySetInnerHTML={{ __html: "try{if(localStorage.getItem('theme')==='light')document.documentElement.classList.add('light')}catch(e){}" }} />
        <SolanaProvider>
        <Nav />
        <main className="mx-auto w-full max-w-[1240px] px-4 pb-24 sm:px-6">{children}</main>
        <MobileTabBar />
        <footer className="mx-auto max-w-[1240px] border-t border-line px-4 py-10 text-sm text-faint sm:px-6">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 font-semibold text-dim">
              <span className="text-acc">◆</span> LootRadar
              <span className="text-faint">— the Web3 game radar</span>
            </div>
            <div className="flex flex-wrap gap-5">
              <a className="hover:text-dim" href="/rankings">Rankings</a>
              <a className="hover:text-dim" href="/community">Community</a>
              <a className="hover:text-dim" href="/submit">Submit a game</a>
              <a className="hover:text-dim" href="/boost">Boost</a>
              <a className="hover:text-dim" href="https://x.com/LootRadario" target="_blank" rel="noopener noreferrer">X ↗</a>
              <a className="hover:text-dim" href="mailto:lootradarr@gmail.com">Contact</a>
            </div>
          </div>
          <p className="mt-6 text-xs text-faint">Market data via DexScreener. Not financial advice. Player counts are self-reported by projects. Get in touch: <a href="mailto:lootradarr@gmail.com" className="text-dim hover:text-acc">lootradarr@gmail.com</a></p>
        </footer>
        </SolanaProvider>
      </body>
      {GA_ID ? <GoogleAnalytics gaId={GA_ID} /> : null}
    </html>
  );
}
