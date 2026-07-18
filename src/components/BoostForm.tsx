'use client';
import { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { SystemProgram, Transaction, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { BOOST_TIERS, BOOST_TREASURY, getTier } from '@/lib/boost';

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

  const tier = getTier(tierId)!;

  async function boost() {
    if (!connected || !publicKey) { setVisible(true); return; }
    if (!gameId) { setErr('Pick a game to boost.'); return; }
    setErr(''); setState('paying');
    try {
      const lamports = Math.round(tier.sol * LAMPORTS_PER_SOL);
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      const tx = new Transaction().add(
        SystemProgram.transfer({ fromPubkey: publicKey, toPubkey: new PublicKey(BOOST_TREASURY), lamports }),
      );
      tx.recentBlockhash = blockhash;
      tx.feePayer = publicKey;
      const sig = await sendTransaction(tx, connection);
      await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, 'confirmed');

      setState('verifying');
      const r = await fetch('/api/boost', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ gameId, tierId, signature: sig, payerWallet: publicKey.toBase58() }),
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
        <a href="/" className="btn-primary mt-2">See it on the board</a>
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
              <div className="mono mt-1 text-2xl font-black text-ink">{t.sol} <span className="text-sm text-faint">SOL</span></div>
              <div className="mt-0.5 text-xs text-dim">{t.days} days featured</div>
            </button>
          ))}
        </div>
      </div>

      {/* özet + öde */}
      <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-faint">Total due</div>
          <div className="mono text-2xl font-black text-ink">{tier.sol} SOL</div>
          <div className="text-xs text-dim">{tier.days} days · paid to LootRadar treasury on Solana</div>
        </div>
        {connected ? (
          <button onClick={boost} disabled={busy || games.length === 0} className="btn-primary disabled:opacity-60">
            {state === 'paying' ? 'Confirm in wallet…' : state === 'verifying' ? 'Verifying payment…' : `Pay ${tier.sol} SOL & Boost`}
          </button>
        ) : (
          <button onClick={() => setVisible(true)} className="btn-primary">Connect Wallet</button>
        )}
      </div>

      {err && <p className="rounded-lg border border-down/40 bg-down/10 px-3 py-2 text-sm text-down">{err}</p>}
      <p className="text-center text-xs text-faint">Boost activates within seconds of on-chain confirmation. Stacks on any active boost.</p>
    </div>
  );
}
