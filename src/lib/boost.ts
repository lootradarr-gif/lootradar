// Boost = sabit süre, USD'ye sabitlenmiş $LOOT ücreti. Ödeme İKİYE bölünür:
// yarısı treasury'ye, yarısı YAKMA adresine — ikisi de aynı tx içinde ve zincirde doğrulanır.
/**
 * $LOOT boost ödemelerinin gittiği hazine.
 *
 * ⚠️ BOMB Miner'ın hazinesinden AYRI. İkisi aynı adresi kullanırken LootRadar boost'ları
 * ile oyun içi alımlar aynı cüzdanda karışıyordu — ödeme denetiminde LootRadar boost'u
 * "karşılıksız BOMB Miner ödemesi" gibi görünüp yanlış alarm vermişti.
 */
export const BOOST_TREASURY = '2fn7RBcLJY7FiBLkevqZ87KGypcQQUBvqERoc8W4vPnW';

/** Eski ortak hazine — geçmiş SOL boost kayıtları buna gitmişti, referans için duruyor. */
export const LEGACY_SOL_TREASURY = '6zDgRPjYU27eJFCR9RUCd9eeJjmY5v6rVgrhnmaDx6Rs';
export const LAMPORTS_PER_SOL = 1_000_000_000;

/**
 * Ödemenin yakıma AYRILAN yüzdesi. Kalanı haftalık POOL'u fonlar.
 *
 * ⚠️ Yakma ÖDEME ANINDA olmuyor. Tüm tutar tek transferle hazineye gelir; yakma haftalık
 * olarak ELLE yapılır. Sebep: ödeme anında yakmak ya iki transferli tx ya da burn komutu
 * ayrıştırması gerektiriyordu — ikisi de akışı kırılganlaştırıyordu. Bu yüzde muhasebe
 * içindir: "bu haftaki boost gelirinin ne kadarı yakılacak" sorusunun cevabı.
 */
export const BURN_PCT = 50;

export interface BoostTier {
  id: string;
  label: string;
  usd: number;   // USD hedefi — ödenecek LOOT canlı fiyattan hesaplanır (bkz. loot-price.ts)
  days: number;
  popular?: boolean;
}

// USD'ye SABİTLENDİ. Sabit LOOT fiyatı olsaydı token 3'e katlandığında boost 3 kat
// pahalı, yarıya düştüğünde yarı fiyat olurdu. Böylece paketin DEĞERİ sabit kalır.
export const BOOST_TIERS: BoostTier[] = [
  { id: 'starter', label: 'Starter', usd: 15, days: 3 },
  { id: 'standard', label: 'Standard', usd: 30, days: 7, popular: true },
  { id: 'pro', label: 'Pro', usd: 75, days: 30 },
];

export const getTier = (id: string) => BOOST_TIERS.find((t) => t.id === id) ?? null;

/**
 * Gelen tutarın muhasebe bölüşümü — ÖDEME BÖLÜNMEZ, hepsi hazineye gider.
 * Bu sadece "ne kadarı yakılacak, ne kadarı havuza" hesabıdır (haftalık rapor + POOL).
 */
export function splitBoost(totalRaw: bigint): { burn: bigint; pool: bigint } {
  const burn = (totalRaw * BigInt(BURN_PCT)) / 100n;
  return { burn, pool: totalRaw - burn };
}
