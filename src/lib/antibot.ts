// Anti-bot / Sybil önlemleri: hesap yaşı + IP başına günlük eylem limiti.
// Cüzdan-başı limitler ayrı (limits.ts). Bu katman "100 cüzdan tek IP'den" saldırısını durdurur.
import { createHash } from 'crypto';
import { prisma } from './prisma';

const SALT = process.env.LOOTRADAR_ADMIN_SECRET || 'lootradar-ip-salt';

export const IP_LIMITS = { vote: 3, post: 6, comment: 9 } as const;
// Yaş geçidi SADECE vote'ta (airdrop güvenliği). Post/comment yeni kullanıcıyı bloklamasın (onboarding);
// onları IP limiti + günlük cap + moderasyon + ban korur.
export const MIN_AGE_HOURS = { vote: 24, post: 0, comment: 0 } as const;

const utcDay = () => new Date().toISOString().slice(0, 10);

// x-forwarded-for (Vercel) → tuzlu hash (ham IP saklamıyoruz, gizlilik).
export function clientIpHash(req: Request): string {
  const xff = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '';
  const ip = xff.split(',')[0].trim() || 'unknown';
  return createHash('sha256').update(SALT + ip).digest('hex').slice(0, 32);
}

export async function ipCount(ipHash: string, kind: keyof typeof IP_LIMITS): Promise<number> {
  return prisma.ipLog.count({ where: { ipHash, kind, day: utcDay() } });
}
export async function logIp(ipHash: string, kind: keyof typeof IP_LIMITS): Promise<void> {
  await prisma.ipLog.create({ data: { ipHash, kind, day: utcDay() } });
}

// hesap kaç saatlik? (yeni cüzdan sürüsünü engellemek için)
export async function accountAgeHours(wallet: string): Promise<number> {
  const u = await prisma.user.findUnique({ where: { wallet }, select: { createdAt: true } });
  if (!u) return 0;
  return (Date.now() - u.createdAt.getTime()) / 3_600_000;
}

// Tek çağrıda kontrol: hesap yaşı + IP limiti. Uygunsa true+ipHash döner, değilse hata mesajı.
export async function passesAntibot(req: Request, wallet: string, kind: keyof typeof IP_LIMITS): Promise<{ ok: true; ipHash: string } | { ok: false; error: string }> {
  const age = await accountAgeHours(wallet);
  if (age < MIN_AGE_HOURS[kind]) {
    const h = MIN_AGE_HOURS[kind];
    return { ok: false, error: `Your account is too new for this. Try again in ${Math.ceil(h - age)}h.` };
  }
  const ipHash = clientIpHash(req);
  if ((await ipCount(ipHash, kind)) >= IP_LIMITS[kind]) {
    return { ok: false, error: 'Daily limit reached from your network. Try again tomorrow.' };
  }
  return { ok: true, ipHash };
}
