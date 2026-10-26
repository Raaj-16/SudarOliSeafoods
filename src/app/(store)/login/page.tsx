import { AccountAuthForm } from '@/components/account-auth-form';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';

export default async function LoginPage({ searchParams }: {
  searchParams: Promise<{ error?: string | string[]; verified?: string; passwordReset?: string }>;
}) {
  const params = await searchParams;
  const error = Array.isArray(params.error) ? params.error[0] : params.error;
  return <><SiteHeader /><main><AccountAuthForm oauthError={error} verified={params.verified === '1'} passwordReset={params.passwordReset === '1'} /></main><SiteFooter /></>;
}
