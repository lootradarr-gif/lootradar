// XP → Level eşikleri (S4 XP sistemiyle ortak kullanılır).
export const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1600, 2400, 3400, 4600, 6000, 8000, 10500, 13500];

export function levelFromXp(xp: number): number {
  let lv = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) if (xp >= LEVEL_THRESHOLDS[i]) lv = i + 1;
  return lv;
}

export function levelProgress(xp: number): { lv: number; cur: number; next: number; pct: number } {
  const lv = levelFromXp(xp);
  const cur = LEVEL_THRESHOLDS[lv - 1] ?? 0;
  const next = LEVEL_THRESHOLDS[lv] ?? cur + 3000;
  const pct = Math.min(100, Math.round(((xp - cur) / (next - cur)) * 100));
  return { lv, cur, next, pct };
}
