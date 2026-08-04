'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { Transaction, PublicKey } from '@solana/web3.js';
import {
  getAssociatedTokenAddressSync, createAssociatedTokenAccountInstruction,
  createTransferCheckedInstruction, TOKEN_2022_PROGRAM_ID,
} from '@solana/spl-token';
import { BOOST_TIERS, getTier } from '@/lib/boost';
import { LOOT } from '@/lib/token';

export type BoostGame = { id: string; name: string; ticker: string; icon: string; iconUrl: string | null };

export function BoostForm({ games }: { games: BoostGame[] }) {
  const { connection } = useConnection();
  const { publicKey, connected, sendTransaction } = useWallet();
  const { setVisible } = useWalletModal();

  const [gameId, setGameId] = useState(games[0]?.id ?? '');
  const [tierId, setTierId] = useState('standard');
  const [state, setState] = useState<'idle' | 'paying' | 'verifying' | 'ok' | 'err'>('idle');
  const [err, setErr] = useState('');
  const [until, setUntil] = useState('');
  // Canlı $LOOT fiyatı — paketler USD'ye sabit, gösterilen LOOT tutarı fiyata göre değişir.
  const [price, setPrice] = useState<number | null>(null);
  useEffect(() => {
    let dead = false;
    const load = () => fetch('/api/boost/price').then((r) => r.json())
      .then((d) => { if (!dead && d?.priceUsd) setPrice(d.priceUsd); }).catch(() => {});
    load();
    const id = setInterval(load, 60_000);   // 1dk'da bir tazele
    return () => { dead = true; clearInterval(id); };
  }, []);
  const lootFor = (usd: number) => (price ? usd / price : null);
  const fmtLoot = (n: number | null) => n === null ? '—'
    : n >= 1e6 ? `${(n / 1e6).toFixed(2)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}K` : n.toFixed(0);

  const tier = getTier(tierId)!;

  async function boost() {
    if (!connected || !publicKey) { setVisible(true); return; }
    if (!gameId) { setErr('Pick a game to boost.'); return; }
    setErr(''); setState('paying');
    try {
      // 1) FİYAT KİLİDİ — sunucu tutarı hesaplar ve imzalar. Cüzdan onayı sırasında
      //    fiyat oynasa bile ödeme reddedilmez (bkz. lib/boost-quote.ts).
      const qr = await fetch('/api/boost/quote', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ gameId, tierId }),
      });
      const q = await qr.json();
      if (!qr.ok) throw new Error(q?.error || 'Could not get a price quote');

      // 2) TEK transfer — tutarın tamamı hazineye. Yakma ödeme anında değil, haftalık elle.
      const mint = new PublicKey(q.mint);
      const PROG = TOKEN_2022_PROGRAM_ID;
      const from = getAssociatedTokenAddressSync(mint, publicKey, false, PROG);
      const owner = new PublicKey(q.treasuryAddress);
      const to = getAssociatedTokenAddressSync(mint, owner, true, PROG);
      const tx = new Transaction();
      // Hazinenin token hesabı yoksa ilk ödeyen oluşturur (yeni cüzdan hiç LOOT tutmamış olabilir).
      if (!(await connection.getAccountInfo(to))) {
        tx.add(createAssociatedTokenAccountInstruction(publicKey, to, owner, mint, PROG));
      }
      tx.add(createTransferCheckedInstruction(from, mint, to, publicKey, BigInt(q.quote.amount), q.decimals, [], PROG));

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash;
      tx.feePayer = publicKey;
      const sig = await sendTransaction(tx, connection);
      await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, 'confirmed');

      // 3) DOĞRULAMA — sunucu iki transferi de zincirde kontrol eder
      setState('verifying');
      const r = await fetch('/api/boost', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ signature: sig, payerWallet: publicKey.toBase58(), quote: q.quote, quoteSignature: q.signature }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || 'Verification failed');
      setUntil(new Date(data.featuredUntil).toLocaleDateString());
      setState('ok');
    } catch (e: any) {
      setErr(e?.message?.includes('User rejected') ? 'Transaction cancelled.' : (e?.message || 'Something went wrong'));
      setState('err');
    }
  }

  if (state === 'ok') {
    const g = games.find((x) => x.id === gameId);
    return (
      <div className="card grid place-items-center gap-3 p-10 text-center">
        <div className="text-4xl">🚀</div>
        <h2 className="text-xl font-bold">{g?.name} is boosted!</h2>
        <p className="max-w-sm text-sm text-dim">It’s now featured across LootRadar until <b className="text-ink">{until}</b>. Payment confirmed on-chain.</p>
        <Link href="/" className="btn-primary mt-2">See it on the board</Link>
      </div>
    );
  }

  const busy = state === 'paying' || state === 'verifying';

  return (
    <div className="space-y-5">
      {/* oyun seçimi */}
      <div>
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-faint">Game to boost</span>
        {games.length === 0 ? (
          <p className="card p-4 text-sm text-dim">No live games yet. Submit & get approved first.</p>
        ) : (
          <select value={gameId} onChange={(e) => setGameId(e.target.value)}
            className="w-full rounded-xl border border-line bg-panel px-3 py-2.5 text-sm text-ink outline-none focus:border-acc">
            {games.map((g) => <option key={g.id} value={g.id}>{g.name} {g.ticker ? `($${g.ticker})` : ''}</option>)}
          </select>
        )}
      </div>

      {/* kademeler */}
      <div>
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-faint">Duration</span>
        <div className="grid gap-3 sm:grid-cols-3">
          {BOOST_TIERS.map((t) => (
            <button type="button" key={t.id} onClick={() => setTierId(t.id)}
              className={`card relative p-4 text-left transition-colors ${tierId === t.id ? 'border-acc ring-1 ring-acc/40' : 'hover:border-line2'}`}>
              {t.popular && <span className="absolute -top-2 left-4 rounded-full bg-acc px-2 py-0.5 text-[10px] font-bold text-white">POPULAR</span>}
              <div className="text-sm font-semibold text-dim">{t.label}</div>
              <div className="mono mt-1 text-2xl font-black text-ink">{fmtLoot(lootFor(t.usd))} <span className="text-sm text-faint">$LOOT</span></div>
              <div className="mt-0.5 text-xs text-dim">{t.days} days featured · ~${t.usd}</div>
            </button>
          ))}
        </div>
      </div>

      {/* özet + öde */}
      <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-faint">Total due</div>
          <div className="mono text-2xl font-black text-ink">{fmtLoot(lootFor(tier.usd))} $LOOT</div>
          <div className="text-xs text-dim">{tier.days} days · <b className="text-acc">50% burned weekly</b> · 50% funds the community pool</div>
        </div>
        {connected ? (
          <button onClick={boost} disabled={busy || games.length === 0} className="btn-primary disabled:opacity-60">
            {state === 'paying' ? 'Confirm in wallet…' : state === 'verifying' ? 'Verifying payment…' : `Pay ${fmtLoot(lootFor(tier.usd))} $LOOT & Boost`}
          </button>
        ) : (
          <button onClick={() => setVisible(true)} className="btn-primary">Connect Wallet</button>
        )}
      </div>

      {err && <p className="rounded-lg border border-down/40 bg-down/10 px-3 py-2 text-sm text-down">{err}</p>}
      <p className="text-center text-xs text-faint">
        Prices are pegged in USD — the $LOOT amount follows the live price. Half of all boost
        revenue is burned weekly; the other half funds the community pool.
      </p>
    </div>
  );
}
