import { NextResponse } from 'next/server';
import { setStatus, adminSecret } from '@/lib/submissions-admin';

export async function POST(req: Request) {
  const key = req.headers.get('x-admin-secret') || '';
  if (key !== adminSecret()) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const { id, action } = await req.json().catch(() => ({}));
  const status = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : null;
  if (!id || !status) return NextResponse.json({ error: 'bad request' }, { status: 400 });
  const ok = await setStatus(String(id), status);
  return ok ? NextResponse.json({ ok: true, status }) : NextResponse.json({ error: 'not found' }, { status: 404 });
}
