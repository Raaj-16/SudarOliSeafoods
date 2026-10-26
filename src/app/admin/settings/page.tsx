import { AdminSettingsManager } from '@/components/admin-settings-manager';

export default function AdminSettingsPage() {
  return <main className="min-h-screen bg-stone-100 p-8"><div className="mx-auto max-w-3xl"><p className="text-sm uppercase tracking-[0.2em] text-stone-500">Admin</p><h1 className="mt-2 text-4xl font-black text-stone-900">Store settings</h1><p className="mt-3 max-w-2xl text-stone-600">Business contact details and delivery pricing are stored in the database and shown on the storefront. Leave unavailable details blank.</p><div className="mt-8"><AdminSettingsManager /></div></div></main>;
}
