// Günlük sert limitler (spam önleme) — XP cap'inden AYRI, gerçek satır sayısı.
import { prisma } from './prisma';

export const DAILY_POST_LIMIT = 3;
export const DAILY_COMMENT_LIMIT = 3;

function utcMidnight(): Date {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export function postsToday(wallet: string): Promise<number> {
  return prisma.post.count({ where: { authorWallet: wallet, createdAt: { gte: utcMidnight() } } });
}
export function commentsToday(wallet: string): Promise<number> {
  return prisma.comment.count({ where: { authorWallet: wallet, createdAt: { gte: utcMidnight() } } });
}
