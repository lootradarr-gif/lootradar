// $LOOT — platform token'ı. TEK KAYNAK: CA ve linkler burada tanımlı.
//
// CA boş bırakılırsa token barı KENDİLİĞİNDEN GİZLENİR — token çıkmadan önce
// yanlışlıkla boş/sahte bir adres göstermez. Token oluşturulunca `MINT` doldurulur,
// başka hiçbir yeri değiştirmek gerekmez.
export const LOOT = {
  symbol: 'LOOT',
  name: 'LOOT RADAR',
  /** pump.fun mint adresi — token oluşturulunca buraya yapıştır. */
  mint: 'BGyGojJAE8jebxoe5zx7nDU2Fmjp1KABkYBV5rC7pump',
  /** Toplam arz — zincirde doğrulandı. */
  supply: 1_000_000_000 as number | null,
  /** Ondalık (Token-2022, zincirden). Bakiye/eşik hesaplarında kullanılır. */
  decimals: 6,
  /** Mint ve freeze yetkileri REVOKE edilmiş — zincirde doğrulandı 2026-08-04. */
  authoritiesRevoked: true,
};

export const lootLive = () => LOOT.mint.length >= 32;

export const lootLinks = () => ({
  pump: `https://pump.fun/coin/${LOOT.mint}`,
  dex: `https://dexscreener.com/solana/${LOOT.mint}`,
  solscan: `https://solscan.io/token/${LOOT.mint}`,
});

/** Uzun adresi kısalt — şeritte tam adres satırı taşırıyor. */
export const shortCA = (a: string, head = 6, tail = 6) =>
  a.length <= head + tail + 1 ? a : `${a.slice(0, head)}…${a.slice(-tail)}`;
