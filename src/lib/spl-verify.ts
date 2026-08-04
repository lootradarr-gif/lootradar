// On-chain SPL TOKEN ödeme doğrulama ($LOOT boost ödemeleri).
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

/** owner+mint için toplam bakiye (ham birim). Aynı sahibin birden fazla token account'u olabilir. */
function balanceOf(list: any[] | undefined, owner: string, mint: string): bigint {
  let sum = 0n;
  for (const b of list ?? []) {
    if (b?.owner === owner && b?.mint === mint) sum += BigInt(b?.uiTokenAmount?.amount ?? '0');
  }
  return sum;
}

export async function verifyTokenPayment(
  txSig: string,
  fromWallet: string,
  treasury: string,
  mint: string,
  minAmount: bigint,          // ham birim (decimals uygulanmış)
): Promise<{ ok: boolean; reason?: string; paid?: bigint }> {
  try {
    // İndeksleme gecikmesi: ödemeden hemen sonra tx sorgulanamayabilir → meşru ödeme
    // boşuna reddedilmesin diye birkaç kez denenir.
    let tx = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      tx = await conn().getTransaction(txSig, { commitment: 'confirmed', maxSupportedTransactionVersion: 0 });
      if (tx) break;
      if (attempt < 4) await new Promise((r) => setTimeout(r, 1500));
    }
    if (!tx) return { ok: false, reason: 'tx_not_found' };
    if (tx.meta?.err) return { ok: false, reason: 'tx_failed_onchain' };

    const pre = tx.meta?.preTokenBalances as any[] | undefined;
    const post = tx.meta?.postTokenBalances as any[] | undefined;
    if (!post?.length) return { ok: false, reason: 'no_token_transfer' };

    // 2+3: treasury bu mint'ten ne kadar aldı?
    const got = balanceOf(post, treasury, mint) - balanceOf(pre, treasury, mint);
    if (got < minAmount) return { ok: false, reason: `insufficient_${got}` };

    // 4: ödeyen gerçekten ödedi mi?
    const sent = balanceOf(pre, fromWallet, mint) - balanceOf(post, fromWallet, mint);
    if (sent < minAmount) return { ok: false, reason: 'payer_did_not_pay' };

    return { ok: true, paid: got };
  } catch (e: any) {
    return { ok: false, reason: e?.message || 'verify_error' };
  }
}

/**
 * BÖLÜNMÜŞ ÖDEME doğrulama — tek tx içinde hem hazineye hem YAKMA adresine transfer.
 *
 * "Her boost'un yarısı yakılır" iddiasını sözde bırakmamak için: ödeme tx'i İKİ transfer
 * içermeli ve ikisi de doğrulanmalı. Böylece yakma, hazinenin sonradan yapacağı bir vaat
 * değil, ödemenin kendisinde zincire yazılmış bir gerçek olur.
 */
export async function verifySplitTokenPayment(
  txSig: string,
  fromWallet: string,
  treasury: string,
  burnAddress: string,
  mint: string,
  minToTreasury: bigint,
  minToBurn: bigint,
): Promise<{ ok: boolean; reason?: string }> {
  try {
    let tx = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      tx = await conn().getTransaction(txSig, { commitment: 'confirmed', maxSupportedTransactionVersion: 0 });
      if (tx) break;
      if (attempt < 4) await new Promise((r) => setTimeout(r, 1500));
    }
    if (!tx) return { ok: false, reason: 'tx_not_found' };
    if (tx.meta?.err) return { ok: false, reason: 'tx_failed_onchain' };
    const pre = tx.meta?.preTokenBalances as any[] | undefined;
    const post = tx.meta?.postTokenBalances as any[] | undefined;
    if (!post?.length) return { ok: false, reason: 'no_token_transfer' };

    const toTreasury = balanceOf(post, treasury, mint) - balanceOf(pre, treasury, mint);
    if (toTreasury < minToTreasury) return { ok: false, reason: `treasury_short_${toTreasury}` };

    const toBurn = balanceOf(post, burnAddress, mint) - balanceOf(pre, burnAddress, mint);
    if (toBurn < minToBurn) return { ok: false, reason: `burn_short_${toBurn}` };

    const sent = balanceOf(pre, fromWallet, mint) - balanceOf(post, fromWallet, mint);
    if (sent < minToTreasury + minToBurn) return { ok: false, reason: 'payer_did_not_pay' };

    return { ok: true };
  } catch (e: any) {
    return { ok: false, reason: e?.message || 'verify_error' };
  }
}

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
