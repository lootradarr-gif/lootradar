// Boost = sabit SOL ücreti → N gün öne çıkma. Ödeme TEK transfer, zincirde doğrulanır.
//
// NEDEN SOL'A GERİ DÖNÜLDÜ: ücret $LOOT'a bağlıyken paket fiyatı token fiyatıyla oynuyordu
// ve arayüzde "kaç LOOT ödeyeceğim" net görünmüyordu. Sabit SOL fiyatı hem alıcı hem satıcı
// için tek bakışta anlaşılır — fiyat kilidi (quote), canlı fiyat sorgusu ve ATA açma adımı
// tamamen ortadan kalktı.

/**
 * Boost ödemelerinin gittiği hazine.
 *
 * ⚠️ BOMB Miner'ın hazinesinden AYRI TUTULUYOR — ikisi aynı adresi kullanırken LootRadar
 * boost'ları BOMB Miner'ın ödeme denetiminde "karşılıksız ödeme" gibi görünüp yanlış alarm
 * vermişti. SOL'a dönerken bu ayrım KORUNDU; eski ortak adrese geri dönmeyin.
 */
export const BOOST_TREASURY = '2fn7RBcLJY7FiBLkevqZ87KGypcQQUBvqERoc8W4vPnW';

/** Eski ortak hazine — 2026 Temmuz öncesi SOL boost kayıtları buna gitmişti, referans için. */
export const LEGACY_SOL_TREASURY = '6zDgRPjYU27eJFCR9RUCd9eeJjmY5v6rVgrhnmaDx6Rs';

export const LAMPORTS_PER_SOL = 1_000_000_000;

export interface BoostTier {
  id: string;
  label: string;
  sol: number;   // ödenecek SOL — SABİT, fiyat sorgusu yok
  days: number;  // öne çıkma süresi
  popular?: boolean;
}

export const BOOST_TIERS: BoostTier[] = [
  { id: 'starter', label: 'Starter', sol: 0.5, days: 3 },
  { id: 'standard', label: 'Standard', sol: 1, days: 7, popular: true },
  { id: 'pro', label: 'Pro', sol: 2, days: 30 },
];

export const getTier = (id: string) => BOOST_TIERS.find((t) => t.id === id) ?? null;

/** Paketin lamport karşılığı — kayan nokta hatası kalmasın diye yuvarlanır. */
export const tierLamports = (t: BoostTier) => Math.round(t.sol * LAMPORTS_PER_SOL);
