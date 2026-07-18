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
        <span className="chip mx-auto border-gold/30 text-gold">⚡ Boost</span>
        <h1 className="mt-3 text-3xl font-black sm:text-4xl">Get to the top of the radar</h1>
        <p className="mx-auto mt-2 max-w-lg text-dim">
          Feature your game across LootRadar — homepage, rankings, everywhere — with a ★ badge and priority placement.
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
          ['③', 'Instantly featured', 'Verified on-chain in seconds and pushed to the top of the board.'],
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
      </p>
    </div>
  );
}
