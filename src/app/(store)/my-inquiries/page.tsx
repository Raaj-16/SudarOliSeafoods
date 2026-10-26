import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { requireCustomer } from '@/lib/require-auth';
import { hasDatabaseConfig, prisma } from '@/lib/prisma';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export default async function MyInquiriesPage() {
  const user = await requireCustomer();
  const inquiries = hasDatabaseConfig()
    ? await prisma.storefrontSubmission.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
    : [];

  return (
    <>
      <SiteHeader />
      <main className="section">
        <div className="wrap" style={{ maxWidth: 960 }}>
          <div className="eyebrow">Your account</div>
          <h1 className="text-4xl font-black text-stone-900">My enquiries</h1>
          <p className="mt-2 text-stone-600">Enquiries submitted while signed in to this account.</p>
          <div className="mt-8 space-y-4">
            {inquiries.length === 0 ? (
              <div className="cart-empty"><p>No enquiries are linked to this account yet.</p></div>
            ) : inquiries.map((inquiry) => {
              const payload = isRecord(inquiry.payload) ? inquiry.payload : {};
              const items = Array.isArray(payload.items) ? payload.items : [];
              return (
                <article key={inquiry.id} className="border border-stone-300 bg-white p-5">
                  <div className="flex flex-wrap justify-between gap-3">
                    <div>
                      <h2 className="font-semibold capitalize text-stone-900">{inquiry.kind} enquiry</h2>
                      <p className="mt-1 text-sm text-stone-600">Status: {inquiry.status}</p>
                    </div>
                    <p className="text-xs text-stone-500">
                      {new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(inquiry.createdAt)}
                    </p>
                  </div>
                  {items.length > 0 && (
                    <ul className="mt-3 list-disc pl-5 text-sm">
                      {items.map((entry, index) => {
                        const item = isRecord(entry) ? entry : {};
                        const name = typeof item.name === 'string' ? item.name : 'Product';
                        const quantity = item.quantity ?? item.quantityKg ?? '';
                        const variant = typeof item.variant === 'string' ? ` ${item.variant}` : '';
                        return <li key={`${inquiry.id}-${index}`}>{name} · {String(quantity)}{variant}</li>;
                      })}
                    </ul>
                  )}
                  {typeof payload.message === 'string' && <p className="mt-3 whitespace-pre-wrap text-sm">{payload.message}</p>}
                  {typeof payload.notes === 'string' && <p className="mt-3 whitespace-pre-wrap text-sm">{payload.notes}</p>}
                </article>
              );
            })}
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
