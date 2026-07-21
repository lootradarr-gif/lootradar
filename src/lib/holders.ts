// Token holder sayısı — Helius DAS getTokenAccounts ile (SOLANA_RPC = Helius premium URL).
// Bakiyesi > 0 olan BENZERSİZ owner sayılır. Sayfalama cap'li (maliyet sınırı).
// DexScreener holder vermez; bu yüzden zincir-üstünden sayıyoruz.

export async function fetchHolderCount(mint: string): Promise<number | null> {
  const rpc = process.env.SOLANA_RPC || '';
  if (!rpc || !/helius/i.test(rpc)) return null; // getTokenAccounts sadece Helius DAS'ta var
  const owners = new Set<string>();
  let cursor: string | undefined;
  try {
    for (let page = 0; page < 12; page++) { // maks ~12k hesap (çok holder'lı token'da yaklaşık değer)
      const body = {
        jsonrpc: '2.0', id: 'lr-holders', method: 'getTokenAccounts',
        params: { mint, limit: 1000, ...(cursor ? { cursor } : {}), options: { showZeroBalance: false } },
      };
      const r = await fetch(rpc, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(9000) });
      if (!r.ok) break;
      const j: any = await r.json();
      const accts = j?.result?.token_accounts;
      if (!Array.isArray(accts) || accts.length === 0) break;
      for (const a of accts) { if (a?.owner && Number(a.amount) > 0) owners.add(a.owner); }
      cursor = j.result.cursor;
      if (!cursor) break;
    }
  } catch { return owners.size || null; }
  return owners.size;
}
