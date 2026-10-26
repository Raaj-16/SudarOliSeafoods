import { requireAdmin } from '@/lib/require-auth';
import { AdminNav } from '@/components/admin-nav';

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await requireAdmin();
  return (
    <div className="min-h-screen bg-stone-100">
      <AdminNav />
      {children}
    </div>
  );
}
