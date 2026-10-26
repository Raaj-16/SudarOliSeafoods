import { EmailVerificationForm } from '@/components/email-verification-form';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';

export default async function VerifyEmailPage({ searchParams }: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const params = await searchParams;
  const token = Array.isArray(params.token) ? params.token[0] ?? '' : params.token ?? '';
  return <><SiteHeader /><main><EmailVerificationForm token={token} /></main><SiteFooter /></>;
}
