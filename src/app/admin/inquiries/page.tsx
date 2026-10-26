import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/require-auth';

export const dynamic = 'force-dynamic';

export default async function AdminInquiriesPage() {
  await requireAdmin();
  const inquiries = await prisma.storefrontSubmission.findMany({ where: { kind: { in: ['bulk', 'contact', 'enquiry'] } }, orderBy: { createdAt: 'desc' }, take: 100 });
  return <main className="min-h-screen bg-stone-100 p-8"><div className="mx-auto max-w-5xl"><h1 className="text-4xl font-black text-stone-900">Inquiries</h1><p className="mt-2 text-stone-600">WhatsApp enquiries, bulk and contact submissions.</p><div className="mt-8 space-y-4">{inquiries.length ? inquiries.map((inquiry) => {
    const payload = inquiry.payload && typeof inquiry.payload === 'object' && !Array.isArray(inquiry.payload) ? inquiry.payload as Record<string, unknown> : {};
    const customer = payload.customer && typeof payload.customer === 'object' && !Array.isArray(payload.customer) ? payload.customer as Record<string, unknown> : {};
    return <article key={inquiry.id} className="border border-stone-300 bg-white p-5"><div className="flex flex-wrap justify-between gap-3"><div><h2 className="font-semibold text-stone-900">{inquiry.customerName}</h2><p className="text-sm text-stone-600">{inquiry.customerPhone}{inquiry.customerEmail ? ` · ${inquiry.customerEmail}` : ''}</p></div><span className="text-xs uppercase tracking-wider">{inquiry.kind}</span></div>{typeof customer.business === 'string' && <p className="mt-3">Business: {customer.business}</p>}{typeof customer.location === 'string' && <p>Location: {customer.location}</p>}{Array.isArray(payload.items) && <ul className="mt-3 list-disc pl-5 text-sm">{payload.items.map((item, index) => { const row = item as Record<string, unknown>; return <li key={`${inquiry.id}-${index}`}>{String(row.name ?? 'Product')} · {String(row.quantity ?? row.quantityKg ?? '')}{row.variant ? ` ${String(row.variant)}` : ' kg'}</li>; })}</ul>}{typeof payload.message === 'string' && <p className="mt-3 whitespace-pre-wrap">{payload.message}</p>}{typeof payload.notes === 'string' && <p className="mt-3 whitespace-pre-wrap">{payload.notes}</p>}<p className="mt-4 text-xs text-stone-500">{new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(inquiry.createdAt)}</p></article>;
  }) : <div className="border border-stone-300 bg-white p-8 text-stone-600">No inquiries have been received.</div>}</div></div></main>;
}
