'use client';
// Sosyal oturum bağlamı — cüzdanla imzalı giriş (SIWS), mevcut kullanıcı, çıkış.
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import bs58 from 'bs58';

export type SessionUser = {
  wallet: string; displayName: string | null; avatarUrl: string | null; bio?: string; xp: number; level: number;
} | null;

type Ctx = {
  user: SessionUser; loading: boolean; signingIn: boolean;
  signIn: () => Promise<void>; signOut: () => Promise<void>;
  setUser: (u: SessionUser) => void;
};
const UserCtx = createContext<Ctx>({ user: null, loading: true, signingIn: false, signIn: async () => {}, signOut: async () => {}, setUser: () => {} });

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { publicKey, connected, signMessage } = useWallet();
  const { setVisible } = useWalletModal();
  const [user, setUser] = useState<SessionUser>(null);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me').then((r) => r.json()).then((d) => setUser(d.user)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const signIn = useCallback(async () => {
    if (!connected || !publicKey) { setVisible(true); return; }
    if (!signMessage) { alert('Your wallet does not support message signing.'); return; }
    setSigningIn(true);
    try {
      const wallet = publicKey.toBase58();
      const { nonce } = await (await fetch('/api/auth/nonce')).json();
      const message = `LootRadar sign-in\n\nWallet: ${wallet}\nNonce: ${nonce}`;
      const sig = await signMessage(new TextEncoder().encode(message));
      const r = await fetch('/api/auth/verify', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ wallet, nonce, signature: bs58.encode(sig) }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Sign-in failed');
      setUser(d.user);
    } catch (e: any) {
      if (!String(e?.message).includes('User rejected')) alert(e?.message || 'Sign-in failed');
    } finally { setSigningIn(false); }
  }, [connected, publicKey, signMessage, setVisible]);

  const signOut = useCallback(async () => { await fetch('/api/auth/me', { method: 'DELETE' }); setUser(null); }, []);

  return <UserCtx.Provider value={{ user, loading, signingIn, signIn, signOut, setUser }}>{children}</UserCtx.Provider>;
}

export const useUser = () => useContext(UserCtx);
