// Basit dosya-tabanlı submission deposu (DB gelene kadar). Vercel'de FS salt-okunur olabilir →
// yazma /tmp'e düşer, try/catch ile asla 500 atmaz. İleride Prisma modeline taşınır.
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

export interface Submission {
  id: string;
  name: string;
  ticker?: string;
  genre: string;
  tokenAddress?: string;
  iconUrl?: string;      // proje logosu (data URL veya http(s))
  site: string;
  x?: string;
  desc: string;
  contact: string;
  tier: string;
  at: number;
  status: 'pending' | 'approved' | 'rejected';
}

function storeFile(): string {
  // yerelde repo içinde data/, prod'da yazılabilir /tmp
  const local = path.join(process.cwd(), 'data', 'submissions.json');
  return process.env.VERCEL ? path.join(os.tmpdir(), 'solgames-submissions.json') : local;
}

async function readAll(): Promise<Submission[]> {
  try {
    const raw = await fs.readFile(storeFile(), 'utf8');
    return JSON.parse(raw) as Submission[];
  } catch {
    return [];
  }
}

export async function listSubmissions(): Promise<Submission[]> {
  return (await readAll()).sort((a, b) => b.at - a.at);
}

export async function addSubmission(s: Omit<Submission, 'id' | 'at' | 'status'>): Promise<Submission> {
  const all = await readAll();
  const row: Submission = { ...s, id: Math.random().toString(36).slice(2, 10), at: Date.now(), status: 'pending' };
  all.push(row);
  try {
    const f = storeFile();
    await fs.mkdir(path.dirname(f), { recursive: true });
    await fs.writeFile(f, JSON.stringify(all, null, 2), 'utf8');
  } catch {
    /* FS salt-okunur → sessizce geç; başvuru yine de kabul edildi sayılır (ileride DB) */
  }
  return row;
}
