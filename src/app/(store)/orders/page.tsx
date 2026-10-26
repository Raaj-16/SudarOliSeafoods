import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { formatPrice } from '@/lib/store-data';
import { requireCustomer } from '@/lib/require-auth';
import { hasDatabaseConfig, prisma } from '@/lib/prisma';

export default async function OrdersPage() {
  const user = await requireCustomer();
  const orders = hasDatabaseConfig() ? await prisma.order.findMany({
    where: { userId: user.id },
    include: { items: true, payments: { orderBy: { id: 'desc' }, take: 1 } },
    orderBy: { createdAt: 'desc' },
  }) : [];

  return (
    <>
      <SiteHeader />
      <main className="section">
        <div className="wrap" style={{ maxWidth: 960 }}>
          <div className="eyebrow">Your account</div>
          <h1 className="text-4xl font-black text-stone-900">My orders</h1>
          <div className="mt-8 space-y-4">
            {orders.length === 0 ? <div className="cart-empty"><p>No orders yet.</p></div> : orders.map((order) => (
              <article key={order.id} className="border border-stone-300 bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div><p className="text-xs uppercase tracking-[0.2em] text-stone-500">Order {order.id.slice(0, 8).toUpperCase()} · {new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(order.createdAt)}</p><h2 className="mt-2 text-lg font-semibold text-stone-900">{order.items.map((item) => `${item.nameSnapshot} × ${item.qty}`).join(', ')}</h2></div>
                  <div className="text-right"><p className="font-semibold text-stone-900">{formatPrice(order.totalPaise / 100)}</p><p className="mt-1 text-sm text-amber-800">{order.paymentStatus === 'paid' ? 'Paid' : order.status.replaceAll('_', ' ')}</p></div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
