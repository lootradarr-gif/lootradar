'use client';
// Temaya uygun cüzdan butonu. Bağlı değilse modal açar; bağlıysa kısa adres + tıkla-çık.
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { shortAddr } from '@/lib/format';

export function WalletButton({ compact }: { compact?: boolean }) {
  const { publicKey, connected, disconnect, connecting } = useWallet();
  const { setVisible } = useWalletModal();

  if (connected && publicKey) {
    return (
      <button
        onClick={() => disconnect().catch(() => {})}
        title="Disconnect"
        className={`btn-ghost ${compact ? 'btn-sm' : ''} font-mono`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-up" /> {shortAddr(publicKey.toBase58())}
      </button>
    );
  }
  return (
    <button onClick={() => setVisible(true)} className={`btn-primary ${compact ? 'btn-sm' : ''}`}>
      {connecting ? 'Connecting…' : 'Connect Wallet'}
    </button>
  );
}
