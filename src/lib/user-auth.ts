// Cüzdanla imzalı giriş (Sign-In-With-Solana) + imzalı-cookie kullanıcı oturumu.
import crypto from 'crypto';
import nacl from 'tweetnacl';
import bs58 from 'bs58';

export const USER_COOKIE = 'lr_user';
const secret = () => process.env.LOOTRADAR_ADMIN_SECRET || 'change-me';
const sign = (d: string) => crypto.createHmac('sha256', secret()).update(d).digest('base64url');

// ── kullanıcının imzalayacağı mesaj (istemci + sunucu birebir aynı olmalı) ──
export function buildSignInMessage(wallet: string, nonce: string): string {
  return `LootRadar sign-in\n\nWallet: ${wallet}\nNonce: ${nonce}`;
}

// ── nonce: 5 dk geçerli, imzalı, stateless ──
export function makeNonce(): string {
  const rnd = crypto.randomBytes(12).toString('hex');
  const exp = Date.now() + 5 * 60_000;
  return `${rnd}.${exp}.${sign(`n.${rnd}.${exp}`)}`;
}
export function verifyNonce(nonce: string): boolean {
  const p = nonce?.split('.');
  if (!p || p.length !== 3) return false;
  const [rnd, exp, sig] = p;
  if (sign(`n.${rnd}.${exp}`) !== sig) return false;
  return Number(exp) > Date.now();
}

// ── ed25519 imza doğrula: wallet gerçekten mesajı imzalamış mı? ──
export function verifySignature(wallet: string, message: string, signatureB58: string): boolean {
  try {
    const msg = new TextEncoder().encode(message);
    const sig = bs58.decode(signatureB58);
    const pub = bs58.decode(wallet);
    if (pub.length !== 32) return false;
    return nacl.sign.detached.verify(msg, sig, pub);
  } catch {
    return false;
  }
}

// ── oturum tokenı (cüzdan gömülü, 30 gün) ──
export function makeUserSession(wallet: string, ttlMs = 30 * 86_400_000): string {
  const exp = Date.now() + ttlMs;
  const payload = `v1.${wallet}.${exp}`;
  return `${payload}.${sign(payload)}`;
}
export function verifyUserSession(token?: string | null): string | null {
  if (!token) return null;
  const p = token.split('.');
  if (p.length !== 4) return null;
  const [v, wallet, exp, sig] = p;
  const payload = `${v}.${wallet}.${exp}`;
  const expected = sign(payload);
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  if (Number(exp) < Date.now()) return null;
  return wallet;
}
