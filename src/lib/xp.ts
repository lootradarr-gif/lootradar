// XP verme — günlük cap'li (bot farmına karşı) + level güncelleme + XpLog defteri.
import { prisma } from './prisma';
import { levelFromXp } from './levels';

export type XpReason = 'post' | 'comment' | 'vote' | 'like_received' | 'daily' | 'x_share';

// { verilen miktar, günlük event cap sayısı }
const RULES: Record<XpReason, { amt: number; cap: number }> = {
  post: { amt: 10, cap: 5 },
  comment: { amt: 3, cap: 10 },
  vote: { amt: 5, cap: 1 },
  like_received: { amt: 1, cap: 20 },
  daily: { amt: 2, cap: 1 },
  // X paylaşımı en değerli eylem: siteyi dışarıya taşıyor. Bu yüzden en yüksek XP.
  // Cap 2/gün — spam'i sınırlar ama günde iki paylaşımı ödüllendirir.
  x_share: { amt: 15, cap: 2 },
};

const utcDay = (d = new Date()) => d.toISOString().slice(0, 10);

// wallet'a XP ver (o gün için cap dolmadıysa). Kullanıcı yoksa oluşturur.
export async function grantXp(wallet: string, reason: XpReason): Promise<number> {
  const rule = RULES[reason];
  if (!rule) return 0;
  const day = utcDay();
  const used = await prisma.xpLog.count({ where: { wallet, day, reason } });
  if (used >= rule.cap) return 0;

  // TEK İŞLEM: defter kaydı ile User.xp artışı BİRLİKTE geçer ya da BİRLİKTE düşer.
  // Ayrı sorgular olduğunda ikincisi (Neon serverless bağlantı kesintisi vb.) düşerse
  // log kalıyor ama XP artmıyordu — kullanıcının XP'si sessizce eksiliyordu.
  const [, u] = await prisma.$transaction([
    prisma.xpLog.create({ data: { wallet, amount: rule.amt, reason, day } }),
    prisma.user.upsert({
      where: { wallet },
      create: { wallet, xp: rule.amt, level: levelFromXp(rule.amt) },
      update: { xp: { increment: rule.amt } },
      select: { xp: true },
    }),
  ]);

  // Seviye artan XP'den türetilir. Ayrı sorgu, çünkü increment sonucunu ancak
  // işlem bittikten sonra biliyoruz; düşerse sadece seviye rozeti gecikir, XP kaybolmaz.
  const lv = levelFromXp(u.xp);
  await prisma.user.update({ where: { wallet }, data: { level: lv } }).catch(() => {});
  return rule.amt;
}
