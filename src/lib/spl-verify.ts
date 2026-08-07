// On-chain SPL TOKEN okuma — $LOOT bakiyesi (Community Pool uygunluk şartı).
//
// SOL doğrulamasından FARKI: SOL'de hesabın lamport bakiyesine bakılır. Token'da ise
// bakiye ayrı bir "token account"ta durur, o yüzden lamport karşılaştırması İŞE YARAMAZ.
// Doğru yol: tx meta'sındaki preTokenBalances / postTokenBalances tablolarını okumak.
//
// Kontroller (hepsi geçmeli):
//   1. tx var + zincirde başarılı (meta.err yok)
//   2. mint DOĞRU token ($LOOT) — başka bir token'la ödeme kabul edilmez
//   3. alıcı (treasury) bakiyesi >= minAmount ARTMIŞ
//   4. ödeyen bakiyesi >= minAmount AZALMIŞ — başkasının ödemesini sahiplenmeyi engeller
import { Connection } from '@solana/web3.js';

const RPC = process.env.SOLANA_RPC || 'https://api.mainnet-beta.solana.com';
let _conn: Connection | null = null;
const conn = () => (_conn ??= new Connection(RPC, 'confirmed'));

// NOT: token ile ÖDEME doğrulayıcıları (verifyTokenPayment / verifySplitTokenPayment)
// kaldırıldı — boost ücretleri SOL'a döndü ve zincirde solana-verify.ts doğruluyor.
// Burada kalan tek iş: bir cüzdanın $LOOT BAKİYESİNİ okumak (havuz uygunluk şartı).

/** owner'ın bir mint'teki GÜNCEL bakiyesi (ham birim) — POOL uygunluk kontrolü için. */
export async function tokenBalance(owner: string, mint: string): Promise<bigint> {
  try {
    const { PublicKey } = await import('@solana/web3.js');
    const res = await conn().getParsedTokenAccountsByOwner(new PublicKey(owner), { mint: new PublicKey(mint) });
    let sum = 0n;
    for (const a of res.value) sum += BigInt(a.account.data.parsed?.info?.tokenAmount?.amount ?? '0');
    return sum;
  } catch { return 0n; }
}
