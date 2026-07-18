// XP verme — günlük cap'li (bot farmına karşı) + level güncelleme + XpLog defteri.
import { prisma } from './prisma';
import { levelFromXp } from './levels';

export type XpReason = 'post' | 'comment' | 'vote' | 'like_received' | 'daily';

// { verilen miktar, günlük event cap sayısı }
const RULES: Record<XpReason, { amt: number; cap: number }> = {
  post: { amt: 10, cap: 5 },
  comment: { amt: 3, cap: 10 },
  vote: { amt: 5, cap: 1 },
  like_received: { amt: 1, cap: 20 },
  daily: { amt: 2, cap: 1 },
};

const utcDay = (d = new Date()) => d.toISOString().slice(0, 10);

// wallet'a XP ver (o gün için cap dolmadıysa). Kullanıcı yoksa oluşturur.
export async function grantXp(wallet: string, reason: XpReason): Promise<number> {
  const rule = RULES[reason];
  if (!rule) return 0;
  const day = utcDay();
  const used = await prisma.xpLog.count({ where: { wallet, day, reason } });
  if (used >= rule.cap) return 0;

  await prisma.xpLog.create({ data: { wallet, amount: rule.amt, reason, day } });
  const u = await prisma.user.upsert({
    where: { wallet },
    create: { wallet, xp: rule.amt, level: levelFromXp(rule.amt) },
    update: { xp: { increment: rule.amt } },
    select: { xp: true },
  });
  await prisma.user.update({ where: { wallet }, data: { level: levelFromXp(u.xp) } });
  return rule.amt;
}
