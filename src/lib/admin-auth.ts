// /admin39 için imzalı-cookie oturumu. Şifre doğruysa HMAC-imzalı, süreli token verilir.
import crypto from 'crypto';

export const ADMIN_COOKIE = 'lr_admin';

const secret = () => process.env.LOOTRADAR_ADMIN_SECRET || 'change-me';
export const adminPassword = () => process.env.LOOTRADAR_ADMIN_PW || 'Dirmenci.39';

const sign = (data: string) => crypto.createHmac('sha256', secret()).update(data).digest('base64url');

// 7 gün geçerli imzalı oturum tokenı
export function makeSession(ttlMs = 7 * 86_400_000): string {
  const payload = `v1.${Date.now() + ttlMs}`;
  return `${payload}.${sign(payload)}`;
}

export function verifySession(token?: string | null): boolean {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [v, exp, sig] = parts;
  const payload = `${v}.${exp}`;
  // zamanlama-güvenli karşılaştırma
  const expected = sign(payload);
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
  return Number(exp) > Date.now();
}
