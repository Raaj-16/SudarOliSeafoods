import Link from 'next/link';
import { PolicyPage } from '@/components/policy-page';

export default function TermsPage() {
  return (
    <PolicyPage title="Terms of sale">
      <p>These terms apply to enquiries and orders arranged with Sudar Oli Dry Sea Foods. By sending an enquiry, you confirm that the contact and delivery details you share are accurate.</p>
      <h2>Products, availability and prices</h2>
      <p>Products are prepared in batches and availability can change with the catch and drying conditions. Prices and stock shown on the website may change; the shop confirms availability and the final total with you in WhatsApp before accepting an order.</p>
      <h2>Orders and payment</h2>
      <p>The website sends an order enquiry to the shop; it does not collect payment or reserve stock. After confirming your order and delivery charges, the shop sends a payment QR code to you in WhatsApp. Pay only after checking the confirmed total and recipient details.</p>
      <h2>Delivery and returns</h2>
      <p>Delivery information is described in our <Link href="/shipping">shipping policy</Link>. For a damaged, incorrect, or otherwise disputed order, contact us promptly with the order reference and relevant details so we can review it under our <Link href="/refunds">returns and refunds policy</Link>.</p>
      <h2>Contact</h2>
      <p>Questions about an order or these terms? Use our <Link href="/contact">contact page</Link>.</p>
    </PolicyPage>
  );
}