// COMMUNITY POOL — haftalık $LOOT dağıtımı.
//
// TASARIM KARARI: uygunluk şartı XP değil, minimum LOOT TUTMAK.
// XP'ye doğrudan ödül bağlamak bot çiftliğini davet ediyor — günlük cap'ler tek cüzdanı
// sınırlıyor ama cüzdan açmak bedava, 100 cüzdanla cap 100 katına çıkar. Minimum bakiye
// şartı üç işi birden yapıyor: sybil'i pahalı yapar, token'a gerçek talep yaratır
// (kazanmak için tutmak gerek), ödülü gerçek kullanıcıya yönlendirir.
//
// XP payı ise KİMİN ne kadar alacağını belirler. Yani: tutmak KAPIDIR, XP PAYDIR.
import { LOOT } from './token';

/** Havuzdan pay almak için gereken minimum $LOOT (okunabilir birim). */
export const POOL_MIN_HOLD = 500_000;

/** Ham birime çevir — zincir bakiyesi ham gelir. */
export const minHoldRaw = () => BigInt(POOL_MIN_HOLD) * BigInt(10 ** LOOT.decimals);

/**
 * ISO hafta anahtarı — "2026-W31". Pazartesi başlangıçlı.
 * weekKey @unique olduğu için aynı hafta iki kez settle EDİLEMEZ (çift ödeme koruması).
 */
export function weekKey(d = new Date()): string {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = (t.getUTCDay() + 6) % 7;              // Pzt=0
  t.setUTCDate(t.getUTCDate() - dayNum + 3);           // o haftanın Perşembesi
  const firstThu = new Date(Date.UTC(t.getUTCFullYear(), 0, 4));
  const fDayNum = (firstThu.getUTCDay() + 6) % 7;
  firstThu.setUTCDate(firstThu.getUTCDate() - fDayNum + 3);
  const week = 1 + Math.round((t.getTime() - firstThu.getTime()) / (7 * 86_400_000));
  return `${t.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

/** Haftanın UTC başlangıcı (Pazartesi 00:00) ve bitişi. */
export function weekRange(d = new Date()): { start: Date; end: Date } {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = (t.getUTCDay() + 6) % 7;
  const start = new Date(t.getTime() - dayNum * 86_400_000);
  return { start, end: new Date(start.getTime() + 7 * 86_400_000) };
}

/** YYYY-MM-DD listesi — XpLog.day string olduğu için aralık sorgusu böyle yapılır. */
export function daysOfWeek(d = new Date()): string[] {
  const { start } = weekRange(d);
  return Array.from({ length: 7 }, (_, i) =>
    new Date(start.getTime() + i * 86_400_000).toISOString().slice(0, 10));
}

/**
 * XP payına göre havuzu böl. Toplam XP 0 ise kimse alamaz.
 * Yuvarlama AŞAĞI — havuzdan fazla dağıtmak imkansız olsun.
 */
export function shareOut(pool: number, rows: { wallet: string; xp: number }[]): Map<string, number> {
  const total = rows.reduce((a, r) => a + r.xp, 0);
  const out = new Map<string, number>();
  if (total <= 0) return out;
  for (const r of rows) out.set(r.wallet, Math.floor((pool * r.xp) / total));
  return out;
}
