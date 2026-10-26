import Link from 'next/link';
import { PolicyPage } from '@/components/policy-page';
import { getStorefrontSettings } from '@/lib/site-settings';

export const dynamic = 'force-dynamic';

export default async function RefundsPage() {
  const settings = await getStorefrontSettings();
  const email = settings?.email || 'sudarolidryseafoods@gmail.com';
  return (
    <PolicyPage title="Returns and refunds">
      <p>Because dried seafood is a perishable food product, contact the shop before returning any item. Do not send food back without instructions.</p>
      <h2>Report an order issue</h2>
      <p>If an order is damaged, incorrect, or has another issue, contact us with your order reference, a description of the problem, and photographs where useful. We will review the details and explain the available resolution.</p>
      <h2>Order cancellation</h2>
      <p>Contact us as soon as possible if you need to request a cancellation. Requests are reviewed based on whether the order has already been prepared or dispatched; a cancellation is not confirmed until the shop responds.</p>
      <h2>Approved refunds</h2>
      <p>Where a refund is approved, the shop will contact you to arrange the refund directly. The timing depends on the payment method and financial institution. Confirm the refund arrangement with the shop before sharing any payment details.</p>
      <h2>Contact</h2>
      <p>Email <a href={`mailto:${email}`}>{email}</a> or use the <Link href="/contact">contact page</Link>. Include the order reference so the shop can locate your purchase.</p>
    </PolicyPage>
  );
}