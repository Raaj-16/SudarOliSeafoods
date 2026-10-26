import Link from 'next/link';
import { PolicyPage } from '@/components/policy-page';
import { getStorefrontSettings } from '@/lib/site-settings';

export const dynamic = 'force-dynamic';

export default async function PrivacyPage() {
  const settings = await getStorefrontSettings();
  return (
    <PolicyPage title="Privacy policy">
      <p>This policy explains how Sudar Oli Dry Sea Foods uses information you provide when browsing, contacting us, signing in, or sending an order enquiry.</p>
      <h2>Information we use</h2>
      <p>Depending on how you use the store, we may process your name, phone number, email address, delivery details you share, enquiry contents, administrator sign-in records, and messages sent through our forms. Cart and favourites for visitors are stored in that browser until cleared.</p>
      <h2>Why we use it</h2>
      <ul>
        <li>To respond to enquiries and arrange orders and delivery.</li>
        <li>To verify administrator sign-in and protect the admin portal.</li>
        <li>To manage stock, prevent abuse, and meet applicable legal or accounting obligations.</li>
      </ul>
      <h2>Service providers</h2>
      <p>We use service providers for website hosting, database storage, Google sign-in, image storage, and communications. Customers arrange payment directly with the shop after it confirms an order; the website does not collect payment credentials.</p>
      <h2>Retention and your requests</h2>
      <p>Order and accounting records may need to be retained for business and legal requirements. For questions, access or correction requests, or a deletion request where applicable, contact us at <a href={`mailto:${settings?.email || 'sudarolidryseafoods@gmail.com'}`}>{settings?.email || 'sudarolidryseafoods@gmail.com'}</a>.</p>
      <h2>Contact</h2>
      <p>See our <Link href="/contact">contact page</Link> for current business contact details.</p>
    </PolicyPage>
  );
}