import { prisma } from '@/lib/prisma';
import { BoostForm, type BoostGame } from '@/components/BoostForm';
import { BOOST_TIERS } from '@/lib/boost';

export const dynamic = 'force-dynamic';

export default async function Boost() {
  const rows = await prisma.game.findMany({
    where: { reviewStatus: 'APPROVED' },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, ticker: true, icon: true, iconUrl: true },
  });
  const games: BoostGame[] = rows;
  const cheapest = Math.min(...BOOST_TIERS.map((t) => t.sol));

  return (
    <div className="mx-auto max-w-2xl pt-8">
      <div className="mb-8 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/boost-3d.svg" alt="Boost" width={72} height={72} className="mx-auto h-18 w-18 drop-shadow-[0_6px_16px_rgba(255,190,60,0.35)]" style={{ height: 72, width: 72 }} />
        <h1 className="mt-3 text-3xl font-black sm:text-4xl">Get to the top of the radar</h1>
        <p className="mx-auto mt-2 max-w-lg text-dim">
          Feature your game across LootRadar — homepage Trending, rankings, everywhere — with a ★ badge and priority placement.
          Pay once in SOL, stay boosted for the full period. From {cheapest} SOL.
        </p>
      </div>

      <div className="card p-6">
        <BoostForm games={games} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          ['①', 'Pick your game & duration', 'Choose one of your approved games and how long to feature it.'],
          ['②', 'Pay in SOL', 'One on-chain payment to the treasury — no subscription, no lock-in.'],
          ['③', 'Boosts stack up', 'Multiple boosts on the same game add up — each payment extends the featured time on top of what is left.'],
        ].map(([n, t, d]) => (
          <div key={t} className="card p-4">
            <div className="text-lg text-acc">{n}</div>
            <div className="mt-1 text-sm font-semibold text-ink">{t}</div>
            <div className="mt-1 text-xs text-dim">{d}</div>
          </div>
        ))}
      </div>
      <p className="mt-6 text-center text-xs text-faint">
        Payments settle to the LootRadar treasury on Solana. Boosts activate within seconds of confirmation.
        <br />Custom / long-term placement? <a href="mailto:lootradarr@gmail.com" className="text-acc hover:underline">lootradarr@gmail.com</a>
      </p>
    </div>
  );
}
