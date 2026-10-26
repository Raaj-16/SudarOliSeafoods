import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/require-auth';
import { formatPrice } from '@/lib/store-data';

export const dynamic = 'force-dynamic';

export default async function AdminOrdersPage() {
  await requireAdmin();
  const orders = await prisma.order.findMany({ include: { user: true, items: true, payments: true }, orderBy: { createdAt: 'desc' }, take: 100 });
  return <main className="min-h-screen bg-stone-100 p-8"><div className="mx-auto max-w-6xl"><h1 className="text-4xl font-black text-stone-900">Orders</h1><p className="mt-2 text-stone-600">Latest orders from the database.</p><div className="mt-8 space-y-4">{orders.length ? orders.map((order) => {
    const address = order.addressJson && typeof order.addressJson === 'object' && !Array.isArray(order.addressJson) ? order.addressJson as Record<string, unknown> : {};
    return <article key={order.id} className="border border-stone-300 bg-white p-5"><div className="flex flex-wrap justify-between gap-4"><div><p className="text-xs uppercase tracking-wider text-stone-500">{order.id}</p><h2 className="mt-2 font-semibold">{typeof address.name === 'string' ? address.name : order.user?.name ?? 'Customer'}</h2><p className="text-sm text-stone-600">{typeof address.phone === 'string' ? address.phone : order.user?.phone}</p><ul className="mt-3 text-sm">{order.items.map((item) => <li key={item.id}>{item.nameSnapshot} × {item.qty}</li>)}</ul></div><div className="text-right"><p className="font-semibold">{formatPrice(order.totalPaise / 100)}</p><p className="capitalize text-stone-600">{order.status.replaceAll('_', ' ')}</p><p className="text-sm text-stone-500">{order.paymentMethod} · {order.paymentStatus ?? 'unpaid'}</p><p className="text-xs text-stone-500">{new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(order.createdAt)}</p></div></div></article>;
  }) : <div className="border border-stone-300 bg-white p-8 text-stone-600">No orders have been placed.</div>}</div></div></main>;
}
