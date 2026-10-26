import { AdminProductsManager } from '@/components/admin-products-manager';
import { requireAdmin } from '@/lib/require-auth';

export default async function AdminProductsPage() {
  await requireAdmin();
  return (
    <main className="min-h-screen bg-stone-100 p-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-4xl font-black text-stone-900">Products</h1>
        <div className="mt-8"><AdminProductsManager /></div>
      </div>
    </main>
  );
}
