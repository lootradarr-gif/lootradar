// On-chain SOL ödeme doğrulama (pre/post bakiye + meta.err + payer düşüşü, retry'li).
// txSig gerçekten fromWallet'tan treasury'ye >= minLamports yollamış VE başarılı mı?
// Treasury'nin bakiye artışına (pre/post) + meta.err'e bakar → sahte/başarısız tx reddedilir.
import { Connection } from '@solana/web3.js';

const RPC = process.env.SOLANA_RPC || 'https://api.mainnet-beta.solana.com';
let _conn: Connection | null = null;
const conn = () => (_conn ??= new Connection(RPC, 'confirmed'));

export async function verifySolPayment(
  txSig: string,
  fromWallet: string,
  treasury: string,
  minLamports: number,
): Promise<{ ok: boolean; reason?: string }> {
  try {
    // İndexleme gecikmesi: ödeme sonrası tx hemen sorgulanamayabilir → birkaç kez dene (meşru ödeme boşuna reddedilmesin).
    let tx = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      tx = await conn().getTransaction(txSig, { commitment: 'confirmed', maxSupportedTransactionVersion: 0 });
      if (tx) break;
      if (attempt < 4) await new Promise((r) => setTimeout(r, 1500));
    }
    if (!tx) return { ok: false, reason: 'tx_not_found' };
    if (tx.meta?.err) return { ok: false, reason: 'tx_failed_onchain' };

    const keys = tx.transaction.message.getAccountKeys({ accountKeysFromLookups: tx.meta?.loadedAddresses ?? undefined });
    const indexOf = (addr: string) => {
      for (let i = 0; i < keys.length; i++) if (keys.get(i)?.toBase58() === addr) return i;
      return -1;
    };
    const tIdx = indexOf(treasury);
    const fIdx = indexOf(fromWallet);
    if (tIdx < 0) return { ok: false, reason: 'treasury_not_in_tx' };
    if (fIdx < 0) return { ok: false, reason: 'payer_not_in_tx' };

    const pre = tx.meta?.preBalances ?? [];
    const post = tx.meta?.postBalances ?? [];
    const received = (post[tIdx] ?? 0) - (pre[tIdx] ?? 0);
    if (received < minLamports) return { ok: false, reason: `insufficient_${received}` };
    // ödeyenin bakiyesi gerçekten düşmüş mü? (başkasının ödemesini sahiplenmeyi engeller)
    const sent = (pre[fIdx] ?? 0) - (post[fIdx] ?? 0);
    if (sent < minLamports) return { ok: false, reason: 'payer_did_not_pay' };

    return { ok: true };
  } catch (e: any) {
    return { ok: false, reason: e?.message || 'verify_error' };
  }
}
