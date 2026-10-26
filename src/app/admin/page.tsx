import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/require-auth';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  await requireAdmin();
  const [productCount, orderCount, inquiryCount, unavailableVariants] = await Promise.all([
    prisma.product.count({ where: { isActive: true } }),
    prisma.order.count(),
    prisma.storefrontSubmission.count({ where: { kind: { in: ['bulk', 'contact', 'enquiry'] } } }),
    prisma.productVariant.count({ where: { stockQty: 0 } }),
  ]);
  const stats = [
    { label: 'Active products', value: productCount },
    { label: 'Orders', value: orderCount },
    { label: 'Inquiries', value: inquiryCount },
    { label: 'Unavailable packs', value: unavailableVariants },
  ];
  return <main className="min-h-screen bg-stone-100 p-8"><div className="mx-auto max-w-6xl"><div className="mb-8 flex items-center justify-between gap-4"><div><p className="text-sm uppercase tracking-[0.22em] text-amber-800">Admin</p><h1 className="mt-2 text-4xl font-black text-stone-900">Dashboard</h1></div><Link href="/" className="btn btn-outline btn-sm">View storefront</Link></div><div className="grid gap-5 md:grid-cols-4">{stats.map((stat) => <div key={stat.label} className="border border-stone-300 bg-white p-5"><p className="text-sm text-stone-500">{stat.label}</p><p className="mt-4 text-3xl font-black text-stone-900">{stat.value}</p></div>)}</div><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{[['/admin/products', 'Manage products'], ['/admin/orders', 'Track orders'], ['/admin/inquiries', 'View inquiries'], ['/admin/audit', 'Audit history'], ['/admin/settings', 'Store settings']].map(([href, label]) => <Link key={href} href={href} className="border border-stone-300 bg-white p-5 font-semibold hover:border-amber-700">{label}</Link>)}</div></div></main>;
}
