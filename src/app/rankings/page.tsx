import { getGamesWithMarkets } from '@/lib/games';
import { RankingsTable } from '@/components/RankingsTable';

export const revalidate = 60;

export default async function Rankings() {
  const games = await getGamesWithMarkets();

  return (
    <div className="pt-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold sm:text-3xl">Token rankings</h1>
        <p className="mt-1 text-sm text-dim">Every tracked Solana game — search, filter by genre &amp; sort by market cap, players, holders, gains and more. Live prices via DexScreener.</p>
      </div>
      <RankingsTable games={games} />
    </div>
  );
}
