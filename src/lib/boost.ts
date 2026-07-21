// Boost = sabit ücret: X SOL öde → N gün öne çık. Ödeme LootRadar treasury'sine.
export const BOOST_TREASURY = '6zDgRPjYU27eJFCR9RUCd9eeJjmY5v6rVgrhnmaDx6Rs';
export const LAMPORTS_PER_SOL = 1_000_000_000;

export interface BoostTier {
  id: string;
  label: string;
  sol: number;   // ödenecek SOL
  days: number;  // öne çıkma süresi
  popular?: boolean;
}

export const BOOST_TIERS: BoostTier[] = [
  { id: 'starter', label: 'Starter', sol: 0.5, days: 3 },
  { id: 'standard', label: 'Standard', sol: 1, days: 7, popular: true },
  { id: 'pro', label: 'Pro', sol: 2.5, days: 30 },
];

export const getTier = (id: string) => BOOST_TIERS.find((t) => t.id === id) ?? null;
