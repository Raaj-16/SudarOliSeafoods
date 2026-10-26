import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { PasswordResetForm } from '@/components/password-reset-form';

export default async function ResetPasswordPage({ searchParams }: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const params = await searchParams;
  const token = Array.isArray(params.token) ? params.token[0] ?? '' : params.token ?? '';
  return <><SiteHeader /><main><PasswordResetForm token={token} /></main><SiteFooter /></>;
}
