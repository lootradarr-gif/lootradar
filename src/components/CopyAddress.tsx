'use client';
import { useState } from 'react';

// Token adresi + kopyala butonu.
export function CopyAddress({ address, className = '' }: { address: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard?.writeText(address).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1200); }); }}
      title="Copy address"
      className={`inline-flex items-center gap-2 rounded-lg border border-line bg-panel2/60 px-3 py-2 font-mono text-xs text-dim transition-colors hover:border-acc hover:text-ink ${className}`}
    >
      <span className="truncate">{address}</span>
      <span className="shrink-0 text-faint">{copied ? '✓' : '⧉'}</span>
    </button>
  );
}
