import { listSubmissions } from '@/lib/submissions';
import { adminSecret } from '@/lib/submissions-admin';
import { AdminRows } from '@/components/AdminRows';

export const dynamic = 'force-dynamic';

export default async function Admin({ searchParams }: { searchParams: { key?: string } }) {
  const key = searchParams.key || '';
  if (key !== adminSecret()) {
    return (
      <div className="mx-auto max-w-md pt-20 text-center">
        <div className="text-4xl">🔒</div>
        <h1 className="mt-3 text-xl font-bold">Admin</h1>
        <p className="mt-2 text-sm text-dim">Append <span className="mono text-ink">?key=YOUR_SECRET</span> to the URL to review submissions.</p>
      </div>
    );
  }

  const rows = await listSubmissions();
  const pending = rows.filter((r) => r.status === 'pending').length;

  return (
    <div className="mx-auto max-w-3xl pt-8">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold">Submission review</h1>
          <p className="mt-1 text-sm text-dim">{rows.length} total · {pending} pending</p>
        </div>
      </div>
      <AdminRows rows={rows} secret={key} />
    </div>
  );
}
