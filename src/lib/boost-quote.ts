// BOOST TEKLİFİ — HMAC imzalı, kısa ömürlü fiyat kilidi.
//
// SORUN: paket USD'ye sabitli ama ödeme LOOT ile yapılıyor. Kullanıcı "Öde"ye bastığında
// fiyat X, cüzdanı onayladığında Y olabiliyor. Doğrulamada anlık fiyata bakarsak, fiyat
// bir dakikada yükseldiyse meşru ödeme "eksik" diye reddedilir ve para yanar.
//
// ÇÖZÜM: sunucu tutarı hesaplayıp İMZALAR ve süre verir. İstemci imzalı tutarı öder,
// doğrulama da aynı tutarı kullanır — arada fiyat ne yaparsa yapsın ödeme geçerlidir.
// Stateless: DB'ye teklif yazmaya gerek yok, imza kendisi kanıt.
import { createHmac, timingSafeEqual } from 'crypto';

const SECRET = process.env.ADMIN_PASSWORD || process.env.BLOB_READ_WRITE_TOKEN || 'loot-quote-dev';
export const QUOTE_TTL_MS = 10 * 60_000;      // 10dk — cüzdan onayı için fazlasıyla yeterli

export interface QuotePayload {
  gameId: string;
  tierId: string;
  /** ham LOOT birimi (decimals uygulanmış), string — BigInt JSON'a girmez */
  treasury: string;
  burn: string;
  exp: number;
}

const body = (q: QuotePayload) => `${q.gameId}|${q.tierId}|${q.treasury}|${q.burn}|${q.exp}`;

export function signQuote(q: QuotePayload): string {
  return createHmac('sha256', SECRET).update(body(q)).digest('base64url');
}

export function verifyQuote(q: QuotePayload, sig: string): { ok: true } | { ok: false; reason: string } {
  if (!sig) return { ok: false, reason: 'missing_quote' };
  if (!Number.isFinite(q.exp) || Date.now() > q.exp) return { ok: false, reason: 'quote_expired' };
  const expected = signQuote(q);
  const a = Buffer.from(expected), b = Buffer.from(sig);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return { ok: false, reason: 'bad_quote' };
  return { ok: true };
}
