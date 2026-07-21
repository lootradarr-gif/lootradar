'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useUser } from './UserProvider';
import { Avatar } from './Avatar';
import { timeAgo, shortAddr } from '@/lib/format';

type Author = { wallet: string; displayName: string | null; avatarUrl: string | null; level: number };
type Post = {
  id: string; text: string; imageUrl: string | null; createdAt: string;
  likeCount: number; commentCount: number; pinned: boolean; likedByMe: boolean;
  author: Author; game: { slug: string; name: string } | null;
};
type Comment = { id: string; text: string; createdAt: string; author: Author };
export type GameOpt = { id: string; name: string };

export function CommunityFeed({ initial, nextCursor, games = [], hideComposer, fixedGameId }: { initial: Post[]; nextCursor: string | null; games?: GameOpt[]; hideComposer?: boolean; fixedGameId?: string }) {
  const { user, signIn } = useUser();
  const [posts, setPosts] = useState<Post[]>(initial);
  const [cursor, setCursor] = useState<string | null>(nextCursor);
  const [loadingMore, setLoadingMore] = useState(false);

  async function loadMore() {
    if (!cursor) return;
    setLoadingMore(true);
    try {
      const q = fixedGameId ? `&gameId=${fixedGameId}` : '';
      const r = await fetch(`/api/post?cursor=${cursor}${q}`);
      const d = await r.json();
      setPosts((p) => [...p, ...d.posts]);
      setCursor(d.nextCursor);
    } finally { setLoadingMore(false); }
  }

  return (
    <div className="space-y-4">
      {!hideComposer && (user ? (
        <Composer games={games} fixedGameId={fixedGameId} onPosted={(p) => setPosts((prev) => [p, ...prev])} />
      ) : (
        <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
          <p className="text-sm text-dim">Sign in with your wallet to post and earn XP.</p>
          <button onClick={signIn} className="btn-primary btn-sm">Sign in</button>
        </div>
      ))}

      {posts.length === 0 && <p className="card p-8 text-center text-dim">{hideComposer ? 'No posts yet.' : 'No posts yet — be the first!'}</p>}
      {posts.map((p) => <PostCard key={p.id} post={p} />)}

      {cursor && (
        <div className="text-center">
          <button onClick={loadMore} disabled={loadingMore} className="btn-ghost btn-sm">{loadingMore ? 'Loading…' : 'Load more'}</button>
        </div>
      )}
    </div>
  );
}

function Composer({ games, onPosted, fixedGameId }: { games: GameOpt[]; onPosted: (p: Post) => void; fixedGameId?: string }) {
  const { user } = useUser();
  const [text, setText] = useState('');
  const [image, setImage] = useState('');
  const [gameId, setGameId] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const effectiveGameId = fixedGameId || gameId;

  function onImg(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    if (f.size > 400 * 1024) { setErr('Image must be under 400KB.'); return; }
    setErr(''); const r = new FileReader(); r.onload = () => setImage(String(r.result)); r.readAsDataURL(f);
  }
  async function submit() {
    if (!text.trim()) return;
    setBusy(true); setErr('');
    try {
      const r = await fetch('/api/post', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text, imageUrl: image, gameId: effectiveGameId || undefined }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed');
      onPosted(d.post); setText(''); setImage(''); setGameId('');
    } catch (e: any) { setErr(e?.message || 'Failed'); } finally { setBusy(false); }
  }

  return (
    <div className="card p-4">
      <div className="flex gap-3">
        <Avatar name={user?.displayName || user?.wallet || '?'} url={user?.avatarUrl} />
        <div className="min-w-0 flex-1">
          <textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={500} rows={2}
            placeholder={fixedGameId ? 'Say something about this game… (no links or contract addresses)' : "What's happening in Solana gaming? (no links or contract addresses)"}
            className="w-full resize-none rounded-xl border border-line bg-panel px-3 py-2 text-sm text-ink outline-none focus:border-acc placeholder:text-faint" />
          {image && <div className="mt-2 overflow-hidden rounded-lg border border-line"><img src={image} alt="" className="max-h-48 w-full object-cover" /></div>}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <label className="cursor-pointer rounded-lg bg-panel2 px-2.5 py-1.5 text-xs font-semibold text-dim hover:text-ink">🖼 Image<input type="file" accept="image/*" onChange={onImg} className="hidden" /></label>
            {!fixedGameId && (
              <select value={gameId} onChange={(e) => setGameId(e.target.value)} className="rounded-lg border border-line bg-panel px-2 py-1.5 text-xs text-dim outline-none focus:border-acc">
                <option value="">Tag a game (optional)</option>
                {games.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            )}
            <span className="ml-auto text-[11px] text-faint">{text.length}/500</span>
            <button disabled={busy || !text.trim()} onClick={submit} className="btn-primary btn-sm disabled:opacity-50">{busy ? 'Posting…' : 'Post'}</button>
          </div>
          {err && <p className="mt-2 text-xs text-down">{err}</p>}
        </div>
      </div>
    </div>
  );
}

function PostCard({ post }: { post: Post }) {
  const { user, signIn } = useUser();
  const [liked, setLiked] = useState(post.likedByMe);
  const [likes, setLikes] = useState(post.likeCount);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [commentCount, setCommentCount] = useState(post.commentCount);
  const [ctext, setCtext] = useState('');
  const [cbusy, setCbusy] = useState(false);
  const name = post.author.displayName || shortAddr(post.author.wallet);

  async function toggleLike() {
    if (!user) { signIn(); return; }
    const next = !liked; setLiked(next); setLikes((n) => n + (next ? 1 : -1));
    try { const r = await fetch('/api/post/like', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ postId: post.id }) }); if (!r.ok) throw new Error(); }
    catch { setLiked(!next); setLikes((n) => n + (next ? -1 : 1)); }
  }
  async function openComments() {
    setShowComments((v) => !v);
    if (comments === null) {
      const r = await fetch(`/api/comment?postId=${post.id}`); const d = await r.json(); setComments(d.comments);
    }
  }
  async function addComment() {
    if (!user) { signIn(); return; }
    if (!ctext.trim()) return;
    setCbusy(true);
    try {
      const r = await fetch('/api/comment', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ postId: post.id, text: ctext }) });
      const d = await r.json();
      if (!r.ok) { alert(d.error || 'Failed'); return; }
      setComments((c) => [...(c ?? []), d.comment]); setCommentCount((n) => n + 1); setCtext('');
    } finally { setCbusy(false); }
  }

  return (
    <div className="card p-4">
      <div className="flex gap-3">
        <Link href={`/u/${post.author.wallet}`}><Avatar name={name} url={post.author.avatarUrl} /></Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-sm">
            <Link href={`/u/${post.author.wallet}`} className="font-semibold text-ink hover:text-acc">{name}</Link>
            <span className="mono text-[10px] text-gold">Lv{post.author.level}</span>
            <span className="text-faint">· {timeAgo(post.createdAt)}</span>
            {post.game && <Link href={`/game/${post.game.slug}`} className="ml-1 rounded-full bg-accSoft px-2 py-0.5 text-[11px] font-semibold text-acc">▸ {post.game.name}</Link>}
          </div>
          <p className="mt-1 whitespace-pre-wrap break-words text-sm text-ink">{post.text}</p>
          {post.imageUrl && <div className="mt-2 overflow-hidden rounded-lg border border-line"><img src={post.imageUrl} alt="" className="max-h-96 w-full object-cover" /></div>}
          <div className="mt-2.5 flex items-center gap-4 text-xs text-faint">
            <button onClick={toggleLike} className={`inline-flex items-center gap-1 transition-colors ${liked ? 'text-down' : 'hover:text-down'}`}>{liked ? '♥' : '♡'} {likes}</button>
            <button onClick={openComments} className="inline-flex items-center gap-1 hover:text-acc">💬 {commentCount}</button>
          </div>

          {showComments && (
            <div className="mt-3 space-y-3 border-t border-line/60 pt-3">
              {comments === null ? <p className="text-xs text-faint">Loading…</p> : comments.length === 0 ? <p className="text-xs text-faint">No comments yet.</p> :
                comments.map((c) => {
                  const cn = c.author.displayName || shortAddr(c.author.wallet);
                  return (
                    <div key={c.id} className="flex gap-2">
                      <Link href={`/u/${c.author.wallet}`}><Avatar name={cn} url={c.author.avatarUrl} className="h-6 w-6 text-[10px]" /></Link>
                      <div className="min-w-0 flex-1 rounded-lg bg-panel2/60 px-3 py-1.5">
                        <div className="text-xs"><Link href={`/u/${c.author.wallet}`} className="font-semibold text-ink hover:text-acc">{cn}</Link> <span className="text-faint">· {timeAgo(c.createdAt)}</span></div>
                        <p className="text-sm text-dim">{c.text}</p>
                      </div>
                    </div>
                  );
                })}
              {user && (
                <div className="flex gap-2">
                  <input value={ctext} onChange={(e) => setCtext(e.target.value)} maxLength={300} placeholder="Write a reply…"
                    onKeyDown={(e) => e.key === 'Enter' && addComment()}
                    className="min-w-0 flex-1 rounded-lg border border-line bg-panel px-3 py-1.5 text-sm text-ink outline-none focus:border-acc" />
                  <button disabled={cbusy || !ctext.trim()} onClick={addComment} className="btn-primary btn-sm disabled:opacity-50">Reply</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
