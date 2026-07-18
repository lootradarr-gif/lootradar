'use client';
import { useEffect, useState } from 'react';

// Basit upvote — localStorage'da tutulur (backend gelene kadar). Aktif ve geri alınabilir.
export function VoteButton({ id, votes }: { id: string; votes: number }) {
  const [voted, setVoted] = useState(false);
  useEffect(() => {
    try { setVoted(localStorage.getItem('sg_vote_' + id) === '1'); } catch {}
  }, [id]);

  function toggle() {
    setVoted((v) => {
      const nv = !v;
      try { nv ? localStorage.setItem('sg_vote_' + id, '1') : localStorage.removeItem('sg_vote_' + id); } catch {}
      return nv;
    });
  }

  return (
    <button onClick={toggle} className={`inline-flex items-center gap-1 transition-colors ${voted ? 'text-up' : 'hover:text-up'}`}>
      ▲ {votes + (voted ? 1 : 0)}
    </button>
  );
}
