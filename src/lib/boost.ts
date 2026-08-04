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
 * Solana'nın bilinen yakma (incinerator) adresi. Buraya giden token bir daha çıkarılamaz —
 * özel anahtarı yoktur. "Yarısı yakıldı" iddiası böylece söz değil, herkesin Solscan'den
 * doğrulayabileceği bir olgu olur.
 */
export const BURN_ADDRESS = '1nc1nerator11111111111111111111111111111111';

/** Ödemenin yakılan yüzdesi. Kalanı treasury'ye gider ve haftalık POOL'u fonlar. */
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

/** Toplam ham tutarı hazine/yakma olarak böl. Yakma AŞAĞI yuvarlanır → hazine payı eksik kalmaz. */
export function splitBoost(totalRaw: bigint): { burn: bigint; treasury: bigint } {
  const burn = (totalRaw * BigInt(BURN_PCT)) / 100n;
  return { burn, treasury: totalRaw - burn };
}
