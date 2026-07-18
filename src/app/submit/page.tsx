import { SubmitForm } from '@/components/SubmitForm';

export default function SubmitPage({ searchParams }: { searchParams: { tier?: string } }) {
  const tier = ['free', 'boost', 'featured'].includes(searchParams.tier || '') ? searchParams.tier! : 'free';
  return (
    <div className="mx-auto max-w-2xl pt-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold sm:text-3xl">Submit your game</h1>
        <p className="mt-1 text-sm text-dim">List your game on LootRadar. Free forever — boost whenever you’re ready for more reach.</p>
      </div>
      <div className="card p-6">
        <SubmitForm defaultTier={tier} />
      </div>
    </div>
  );
}
