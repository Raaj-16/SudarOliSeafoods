import { CartContent } from '@/components/cart-content';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';

export const dynamic = 'force-dynamic';

export default function CartPage() {
  return (
    <>
      <SiteHeader />
      <main><CartContent /></main>
      <SiteFooter />
    </>
  );
}
