import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import type { Submission } from './submissions';

function storeFile(): string {
  const local = path.join(process.cwd(), 'data', 'submissions.json');
  return process.env.VERCEL ? path.join(os.tmpdir(), 'solgames-submissions.json') : local;
}

export async function setStatus(id: string, status: Submission['status']): Promise<boolean> {
  try {
    const f = storeFile();
    const all = JSON.parse(await fs.readFile(f, 'utf8')) as Submission[];
    const row = all.find((r) => r.id === id);
    if (!row) return false;
    row.status = status;
    await fs.writeFile(f, JSON.stringify(all, null, 2), 'utf8');
    return true;
  } catch {
    return false;
  }
}

export function adminSecret(): string {
  return (process.env.LOOTRADAR_ADMIN_SECRET || process.env.SOLGAMES_ADMIN_SECRET || 'change-me').trim();
}
