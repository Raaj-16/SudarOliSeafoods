import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/require-auth';

export const dynamic = 'force-dynamic';

export default async function AdminAuditPage() {
  await requireAdmin();
  const entries = await prisma.auditLog.findMany({ orderBy: { at: 'desc' }, take: 200 });
  return <main className="min-h-screen bg-stone-100 p-8"><div className="mx-auto max-w-5xl"><h1 className="text-4xl font-black text-stone-900">Audit log</h1><p className="mt-2 text-stone-600">Recorded administrative changes.</p><div className="mt-8 space-y-4">{entries.length ? entries.map((entry) => <article key={entry.id} className="flex flex-wrap justify-between gap-4 border border-stone-300 bg-white p-5"><div><p className="font-semibold text-stone-900">{entry.entity} updated</p><p className="text-sm text-stone-600">Record {entry.entityId}</p><details className="mt-3 text-sm"><summary className="cursor-pointer">Change details</summary><pre className="mt-2 max-w-full overflow-auto whitespace-pre-wrap">{JSON.stringify({ before: entry.beforeJson, after: entry.afterJson }, null, 2)}</pre></details></div><div className="text-right"><p className="text-xs text-stone-500">Admin {entry.adminId}</p><time className="text-sm text-stone-500">{new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(entry.at)}</time></div></article>) : <div className="border border-stone-300 bg-white p-8 text-stone-600">No administrative changes have been recorded.</div>}</div></div></main>;
}
