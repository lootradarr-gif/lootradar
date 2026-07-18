import Link from 'next/link';

const TIERS = [
  {
    name: 'Free listing', price: '0 SOL', per: 'forever', accent: false,
    tagline: 'Get on the board.',
    feats: ['Listed in Discover & Rankings', 'Live token chart + market data', 'Online player count', 'Community feed access'],
    cta: 'Submit for free', href: '/submit',
  },
  {
    name: 'Boost', price: '1 SOL', per: '/ week', accent: true, badge: 'Most popular',
    tagline: 'Rise above the noise.',
    feats: ['Everything in Free', '★ BOOSTED badge everywhere', 'Priority slot in Trending', 'Featured in the market readout', 'Pinned in Rankings tie-breaks'],
    cta: 'Boost my game', href: '/submit?tier=boost',
  },
  {
    name: 'Featured', price: '3 SOL', per: '/ week', accent: false, badge: 'Max reach',
    tagline: 'Own the front page.',
    feats: ['Everything in Boost', 'Top hero “Market snapshot” slot', 'Dedicated event announcements', 'Homepage takeover card', 'X shout-out from @LootRadar'],
    cta: 'Go featured', href: '/submit?tier=featured',
  },
];

export default function Boost() {
  return (
    <div className="pt-8">
      <div className="mb-8 text-center">
        <span className="chip mx-auto border-gold/30 text-gold">⚡ Boost</span>
        <h1 className="mt-3 text-3xl font-black sm:text-4xl">Skip the line for eyeballs</h1>
        <p className="mx-auto mt-2 max-w-lg text-dim">Getting listed costs nothing. When you want the spotlight, boost it — pay in SOL, no contracts, stop whenever.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {TIERS.map((t) => (
          <div key={t.name} className={`card relative flex flex-col p-6 ${t.accent ? 'border-acc/40 shadow-glow' : ''}`}>
            {t.badge && (
              <span className={`absolute -top-2.5 left-6 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${t.accent ? 'bg-acc text-white' : 'bg-panel2 text-gold'}`}>{t.badge}</span>
            )}
            <div className="text-sm font-semibold text-dim">{t.name}</div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="mono text-3xl font-black text-ink">{t.price}</span>
              <span className="text-sm text-faint">{t.per}</span>
            </div>
            <p className="mt-1 text-sm text-dim">{t.tagline}</p>
            <ul className="mt-5 flex-1 space-y-2.5 text-sm">
              {t.feats.map((f) => (
                <li key={f} className="flex gap-2 text-ink"><span className="text-acc">✓</span>{f}</li>
              ))}
            </ul>
            <Link href={t.href} className={`mt-6 w-full ${t.accent ? 'btn-primary' : 'btn-ghost'}`}>
              {t.cta}
            </Link>
          </div>
        ))}
      </div>

      <p className="mt-8 text-center text-xs text-faint">
        Payments settle to the LootRadar treasury on Solana. Boosts activate within minutes of on-chain confirmation.
      </p>
    </div>
  );
}
