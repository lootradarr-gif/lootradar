'use client';
// COMMUNITY POOL — haftalık $LOOT dağıtımı.
//
// Kural tek cümlede: TUTMAK kapıdır, XP paydır, İLK 10 kazanır.
// Havuza girmek için minimum $LOOT tutman gerekir; ne kadar alacağını o haftaki XP'n
// belirler; havuz sadece sıralamanın ilk 10'una bölünür.
//
// Sayfa üç işi birden yapmalı: ödülü GÖSTERMEK (havuz + geri sayım), yolu ANLATMAK
// (XP nasıl kazanılır) ve tokene ERİŞİM vermek (chart + BUY). Bu yüzden tek kolon
// tablo değil, iki kolonlu bir "kampanya sayfası" düzeni kullanıyoruz.
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Avatar } from '@/components/Avatar';
import { Emoji } from '@/components/Emoji';
import { LOOT, lootLive, lootLinks } from '@/lib/token';

interface Row { rank: number; wallet: string; xp: number; displayName: string | null; avatarUrl: string | null; level: number; estimate: number }
interface Mine { wallet: string; xp: number; rank: number | null; balance: number; eligible: boolean; estimate: number }
interface XpRule { icon: string; label: string; xp: number; cap: string }
interface Data {
  weekKey: string; startsAt: string; endsAt: string; live: boolean;
  poolLoot: number; minHold: number; topN: number; xpRules: XpRule[];
  totalXp: number; settled: boolean; rows: Row[]; mine: Mine | null;
}

const fmt = (n: number) => n >= 1e6 ? `${(n / 1e6).toFixed(n >= 1e7 ? 0 : 2)}M` : n >= 1e3 ? `${Math.round(n / 1e3)}K` : n.toFixed(0);
const full = (n: number) => n.toLocaleString('en-US');
const short = (w: string) => `${w.slice(0, 4)}…${w.slice(-4)}`;
const MEDAL = ['🥇', '🥈', '🥉'];

/** Geri sayım — hedefe kalan gg/ss/dd/sn. Saniye canlı aksın diye 1sn'de bir tick. */
function useCountdown(target?: string) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);
  const left = target ? Math.max(0, new Date(target).getTime() - now) : 0;
  return {
    d: Math.floor(left / 86400000),
    h: Math.floor((left % 86400000) / 3600000),
    m: Math.floor((left % 3600000) / 60000),
    s: Math.floor((left % 60000) / 1000),
    done: left <= 0,
  };
}

function Digit({ v, label }: { v: number; label: string }) {
  return (
    <div className="cd-cell min-w-[62px] rounded-xl border border-line px-2.5 py-2 text-center">
      <div className="mono text-2xl font-black leading-none text-ink sm:text-3xl">{String(v).padStart(2, '0')}</div>
      <div className="mt-1 text-[9px] uppercase tracking-[0.15em] text-faint">{label}</div>
    </div>
  );
}

export default function PoolPage() {
  const { publicKey } = useWallet();
  const [d, setD] = useState<Data | null>(null);

  useEffect(() => {
    const load = () => {
      const q = publicKey ? `?wallet=${publicKey.toBase58()}` : '';
      fetch(`/api/pool${q}`).then((r) => r.json()).then(setD).catch(() => {});
    };
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, [publicKey]);

  // Havuz henüz başlamadıysa BAŞLANGICA, başladıysa BİTİŞE say.
  const pending = !!d && !d.live;
  const cd = useCountdown(pending ? d?.startsAt : d?.endsAt);

  const minHold = d?.minHold ?? 100_000;
  const topN = d?.topN ?? 10;
  const winners = (d?.rows ?? []).filter((r) => r.rank <= topN);
  const rest = (d?.rows ?? []).filter((r) => r.rank > topN);

  return (
    <div className="mx-auto max-w-6xl pt-6 pb-16">

      {/* ══ HERO — havuz + geri sayım + BUY ══ */}
      <section className="hero-glow relative mb-6 overflow-hidden rounded-2xl border border-line bg-panel/40 p-6 sm:p-8">
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{ background: 'radial-gradient(60% 70% at 50% -10%, rgba(255,192,70,0.13), transparent 65%)' }}
        />
        <div className="relative">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="chip border-gold/40 text-gold"><Emoji e="🏆" size={14} /> Weekly Rewards</span>
            <span className="chip">{d?.weekKey ?? '—'}</span>
            {pending && <span className="chip border-acc/40 text-acc"><Emoji e="⏳" size={13} /> Starts soon</span>}
            {d?.live && !d.settled && <span className="chip border-up/40 text-up"><span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-up" /> Live now</span>}
            {d?.settled && <span className="chip border-line2"><Emoji e="✅" size={13} /> Settled</span>}
          </div>

          <h1 className="mt-4 text-center text-3xl font-black tracking-tight text-ink sm:text-5xl">
            Community Pool
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-center text-sm text-dim">
            Every week we split a ${LOOT.symbol} pool between the <b className="text-ink">top {topN}</b> most
            active people on LootRadar. Hold <b className="text-ink">{fmt(minHold)} ${LOOT.symbol}</b> to enter —
            your share is decided by the XP you earn that week.
          </p>

          {/* havuz miktarı */}
          <div className="mt-6 text-center">
            <div className="text-[11px] uppercase tracking-[0.2em] text-faint">This week&apos;s pool</div>
            <div className="pool-figure mono mt-1 text-5xl font-black leading-none sm:text-7xl">
              {d ? fmt(d.poolLoot) : '—'}
            </div>
            <div className="mt-1 text-sm font-bold text-gold/80">${LOOT.symbol}</div>
            {!!d?.poolLoot && <div className="mt-1 mono text-xs text-faint">{full(d.poolLoot)} tokens</div>}
          </div>

          {/* geri sayım */}
          <div className="mt-6">
            <div className="text-center text-[11px] uppercase tracking-[0.2em] text-faint">
              {pending ? 'Rewards start in' : cd.done ? 'Round closed' : 'Round ends in'}
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
              <Digit v={cd.d} label="days" />
              <Digit v={cd.h} label="hrs" />
              <Digit v={cd.m} label="min" />
              <Digit v={cd.s} label="sec" />
            </div>
            {d && (
              <p className="mt-2 text-center text-[11px] text-faint">
                {new Date(d.startsAt).toUTCString().slice(0, 16)} → {new Date(d.endsAt).toUTCString().slice(0, 16)} UTC
              </p>
            )}
          </div>

          {/* aksiyonlar */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {lootLive() && (
              <a href={lootLinks().pump} target="_blank" rel="noreferrer" className="btn-gold-fx px-7 py-3 text-base">
                <Emoji e="💰" size={20} /> Buy ${LOOT.symbol}
              </a>
            )}
            <Link href="/community" className="btn-acc-fx px-7 py-3 text-base">
              <Emoji e="⚡" size={20} /> Start earning XP
            </Link>
          </div>
        </div>
      </section>

      {/* ══ KENDİ DURUMUN ══ */}
      {d?.mine && (
        <section className={`card mb-6 overflow-hidden ${d.mine.eligible ? 'border-up/40' : 'border-gold/40'}`}>
          <div className="grid gap-px bg-line sm:grid-cols-4">
            <div className="bg-panel p-4">
              <div className="text-[10px] uppercase tracking-wide text-faint">Status</div>
              <div className={`mt-1 text-sm font-bold ${d.mine.eligible ? 'text-up' : 'text-gold'}`}>
                {d.mine.eligible ? <><Emoji e="✅" size={15} /> You’re in</> : <><Emoji e="🔒" size={15} /> Not qualified</>}
              </div>
            </div>
            <div className="bg-panel p-4">
              <div className="text-[10px] uppercase tracking-wide text-faint">Your balance</div>
              <div className="mono mt-1 text-sm font-bold text-ink">
                {fmt(d.mine.balance)} <span className="text-faint">/ {fmt(minHold)}</span>
              </div>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-line">
                <div
                  className={`h-full rounded-full ${d.mine.eligible ? 'bg-up' : 'bg-gold'}`}
                  style={{ width: `${Math.min(100, (d.mine.balance / minHold) * 100)}%` }}
                />
              </div>
            </div>
            <div className="bg-panel p-4">
              <div className="text-[10px] uppercase tracking-wide text-faint">Your XP · rank</div>
              <div className="mono mt-1 text-sm font-bold text-ink">
                {d.mine.xp} XP {d.mine.rank ? <span className="text-faint">· #{d.mine.rank}</span> : null}
              </div>
            </div>
            <div className="bg-panel p-4">
              <div className="text-[10px] uppercase tracking-wide text-faint">Projected reward</div>
              <div className={`mono mt-1 text-sm font-black ${d.mine.eligible && d.mine.estimate > 0 ? 'text-gold' : 'text-faint'}`}>
                {fmt(d.mine.estimate)} ${LOOT.symbol}
              </div>
            </div>
          </div>
          {!d.mine.eligible && lootLive() && (
            <div className="border-t border-line bg-panel2/60 px-4 py-2.5 text-xs text-dim">
              You need <b className="text-ink">{fmt(Math.max(0, minHold - d.mine.balance))}</b> more ${LOOT.symbol} to
              qualify. <a href={lootLinks().pump} target="_blank" rel="noreferrer" className="font-semibold text-gold hover:underline">Buy on pump.fun →</a>
            </div>
          )}
        </section>
      )}

      {/* ══ ANA IZGARA — sıralama | yan panel ══ */}
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">

        {/* ─ SIRALAMA ─ */}
        <section>
          <div className="mb-3 flex items-end justify-between">
            <div>
              <h2 className="text-lg font-black text-ink">Pool Leaderboard</h2>
              <p className="text-xs text-dim">
                Top {topN} share the pool · {d?.totalXp ?? 0} XP earned this week
              </p>
            </div>
            <Link href="/community" className="btn-ghost btn-sm">Earn XP →</Link>
          </div>

          {!d && <div className="card p-8 text-center text-dim">Loading…</div>}

          {d && d.rows.length === 0 && (
            <div className="card p-8 text-center">
              <Emoji e="🏁" size={44} />
              <p className="mt-2 text-sm font-semibold text-ink">Nobody on the board yet</p>
              <p className="mx-auto mt-1 max-w-sm text-xs text-dim">
                The board is wide open. Post, comment or vote in Community and you could take
                #1 with your very first action.
              </p>
              <Link href="/community" className="btn-acc-fx btn-sm mt-4">Be the first →</Link>
            </div>
          )}

          {/* kazananlar */}
          <div className="space-y-2">
            {winners.map((r) => {
              const isMe = !!publicKey && r.wallet === publicKey.toBase58();
              const pct = d && d.poolLoot > 0 ? (r.estimate / d.poolLoot) * 100 : 0;
              return (
                <div
                  key={r.wallet}
                  className={`card rank-row relative overflow-hidden p-3 ${
                    isMe ? 'border-acc/60 bg-accsoft/40' : r.rank <= 3 ? 'border-gold/30' : ''
                  }`}
                >
                  {/* pay oranını gösteren ince zemin çubuğu */}
                  <div
                    className="pointer-events-none absolute inset-y-0 left-0 bg-gold/[0.07]"
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                  <div className="relative flex items-center gap-3">
                    <span className="grid w-9 shrink-0 place-items-center">
                      {r.rank <= 3
                        ? <Emoji e={MEDAL[r.rank - 1]} size={28} />
                        : <span className="text-sm font-black text-faint">{r.rank}</span>}
                    </span>
                    <Avatar url={r.avatarUrl} name={r.displayName || r.wallet} className="h-9 w-9 text-xs" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-bold text-ink">
                        {r.displayName || short(r.wallet)}
                        {isMe && <span className="ml-1.5 rounded bg-acc px-1.5 py-0.5 text-[9px] font-black text-white">YOU</span>}
                      </div>
                      <div className="text-[11px] text-faint">Lv.{r.level} · {r.xp} XP</div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="mono text-sm font-black text-gold">{fmt(r.estimate)}</div>
                      <div className="text-[10px] text-faint">${LOOT.symbol} · {pct.toFixed(1)}%</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* eşiğin altındakiler */}
          {rest.length > 0 && (
            <>
              <div className="my-3 flex items-center gap-3">
                <div className="h-px flex-1 bg-line" />
                <span className="text-[10px] uppercase tracking-wider text-faint">Below the cut</span>
                <div className="h-px flex-1 bg-line" />
              </div>
              <div className="space-y-1.5 opacity-60">
                {rest.map((r) => (
                  <div key={r.wallet} className="card flex items-center gap-3 p-2.5">
                    <span className="w-8 shrink-0 text-center text-xs font-bold text-faint">{r.rank}</span>
                    <Avatar url={r.avatarUrl} name={r.displayName || r.wallet} className="h-7 w-7 text-[10px]" />
                    <div className="min-w-0 flex-1 truncate text-xs font-semibold text-dim">
                      {r.displayName || short(r.wallet)}
                    </div>
                    <div className="mono shrink-0 text-xs text-faint">{r.xp} XP</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        {/* ─ YAN PANEL ─ */}
        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">

          {/* canlı chart */}
          {lootLive() && (
            <div className="card overflow-hidden">
              <div className="flex items-center justify-between border-b border-line px-3 py-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-ink">
                  <Emoji e="📈" size={15} /> ${LOOT.symbol} live chart
                </div>
                <a href={lootLinks().dex} target="_blank" rel="noreferrer" className="-my-1 py-1 text-[11px] font-semibold text-acc hover:underline">
                  Open ↗
                </a>
              </div>
              <iframe
                title={`${LOOT.symbol} chart`}
                src={`https://dexscreener.com/solana/${LOOT.mint}?embed=1&theme=dark&trades=0&info=0`}
                className="h-[320px] w-full border-0 bg-bg"
                loading="lazy"
              />
              <div className="border-t border-line p-3">
                <a href={lootLinks().pump} target="_blank" rel="noreferrer" className="btn-gold-fx w-full">
                  <Emoji e="💰" size={17} /> Buy ${LOOT.symbol} on pump.fun
                </a>
              </div>
            </div>
          )}

          {/* nasıl kazanılır */}
          <div className="card p-4">
            <h3 className="text-sm font-black text-ink">How to earn your share</h3>
            <ol className="mt-3 space-y-3">
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accsoft text-[11px] font-black text-acc">1</span>
                <div>
                  <div className="text-xs font-bold text-ink">Hold {fmt(minHold)} ${LOOT.symbol}</div>
                  <div className="text-[11px] text-dim">This is the entry ticket. Checked on-chain when the round settles.</div>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accsoft text-[11px] font-black text-acc">2</span>
                <div>
                  <div className="text-xs font-bold text-ink">Earn XP in Community</div>
                  <div className="text-[11px] text-dim">Your XP decides how big your slice is.</div>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accsoft text-[11px] font-black text-acc">3</span>
                <div>
                  <div className="text-xs font-bold text-ink">Finish in the top {topN}</div>
                  <div className="text-[11px] text-dim">Payouts are sent to your wallet after the round closes.</div>
                </div>
              </li>
            </ol>

            <div className="mt-4 border-t border-line pt-3">
              <div className="text-[10px] uppercase tracking-wide text-faint">XP actions</div>
              <div className="mt-2 space-y-1.5">
                {(d?.xpRules ?? []).map((x) => (
                  <div key={x.label} className="flex items-center gap-2 text-xs">
                    <Emoji e={x.icon} size={17} />
                    <span className="flex-1 text-dim">{x.label}</span>
                    <span className="text-[10px] text-faint">{x.cap}</span>
                    <span className="mono w-10 text-right font-bold text-up">+{x.xp}</span>
                  </div>
                ))}
              </div>
            </div>

            <Link href="/community" className="btn-acc-fx btn-sm mt-4 w-full">Go to Community →</Link>
          </div>

          {/* kurallar */}
          <div className="card p-4 text-[11px] leading-relaxed text-dim">
            <div className="mb-1.5 text-xs font-bold text-ink">The fine print</div>
            <ul className="list-inside list-disc space-y-1">
              <li>Estimates move live as people earn XP — they are not locked in.</li>
              <li>Eligibility is verified on-chain <b className="text-ink">at settlement</b>, not now. Selling before then drops you out.</li>
              <li>Only the top {topN} eligible wallets are paid. Everyone else gets nothing.</li>
              <li>Multi-accounting is checked before payout and disqualified.</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
