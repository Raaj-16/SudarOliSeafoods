import Link from 'next/link';
import { PolicyPage } from '@/components/policy-page';
import { getStorefrontSettings } from '@/lib/site-settings';

export const dynamic = 'force-dynamic';

export default async function ShippingPage() {
  const settings = await getStorefrontSettings();
  return (
    <PolicyPage title="Shipping information">
      <p>Send an enquiry through WhatsApp to check product availability and arrange delivery. Dispatch and delivery timing can vary with the catch, weather, destination, and the time the shop confirms your order.</p>
      <h2>Current dispatch information</h2>
      <p>{settings?.hours || 'Contact the shop to confirm current dispatch timing before placing an order.'}</p>
      <h2>Delivery address</h2>
      <p>Share your name, phone number, delivery address, city, and pincode with the shop in WhatsApp. Contact the shop promptly if any details need correction.</p>
      <h2>Delivery charges</h2>
      <p>The shop confirms delivery charges and the final total in WhatsApp before you pay. Payment is arranged directly with the shop using the QR code it sends you.</p>
      <h2>Need help?</h2>
      <p>For a delivery update or serviceability question, contact us through the <Link href="/contact">contact page</Link>.</p>
    </PolicyPage>
  );
}