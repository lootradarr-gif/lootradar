'use client';
import type { CSSProperties } from 'react';

// 3D emoji (Microsoft Fluent Emoji — 3D) → public/emoji/<slug>.png.
//
// KURAL: burada listelenmeyen bir emoji native glyph olarak basılır ve platformdan
// platforma başka görünür — o yüzden sayfalarda SADECE bu haritadaki emojiler kullanılır.
// Yeni bir emoji gerekiyorsa önce PNG'sini public/emoji/ altına ekle, sonra haritaya yaz.
const MAP: Record<string, string> = {
  '🏆': 'trophy', '👑': 'crown', '⭐': 'star', '🌟': 'star',
  '🥇': 'medal1', '🥈': 'medal2', '🥉': 'medal3',
  '💰': 'moneybag', '🪙': 'coin', '💎': 'gem', '💸': 'moneywings',
  '⚡': 'zap', '🔥': 'fire', '🚀': 'rocket', '🎯': 'target', '🧲': 'magnet',
  '🔒': 'locked', '✅': 'check', '📝': 'memo', '💬': 'speech',
  '⬆️': 'uparrow', '⬆': 'uparrow', '❤️': 'heart', '❤': 'heart',
  '📅': 'calendar', '📈': 'chart', '🎉': 'party', '🏁': 'flag',
  '⏳': 'hourglass', '🐦': 'bird', '🤝': 'handshake', '📖': 'book',
  '⚠️': 'warning', '⚠': 'warning', '❓': 'question', '👤': 'silhouette',
  '📦': 'package', '🛒': 'cart', '🔗': 'link', '🛡️': 'shield', '🛡': 'shield',
};

export function emojiSrc(e: string): string | null {
  const s = MAP[e];
  return s ? `/emoji/${s}.png` : null;
}

export function Emoji({ e, size = 18, className, style }: { e: string; size?: number; className?: string; style?: CSSProperties }) {
  const slug = MAP[e];
  if (!slug) return <span style={style} className={className}>{e}</span>;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/emoji/${slug}.png`} alt={e} width={size} height={size} draggable={false} loading="lazy"
      className={className}
      style={{ display: 'inline-block', verticalAlign: '-0.18em', objectFit: 'contain', ...style }}
    />
  );
}
