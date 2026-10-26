// Builds the WhatsApp enquiry the customer sends to the shop. Pure functions (no browser APIs).

export type EnquiryLine = { name: string; variant: string; quantity: number; price: number };

export function whatsappDigits(raw: string | undefined | null) {
  const digits = (raw ?? '').replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`; // Indian mobile without country code
  return /^\d{11,15}$/.test(digits) ? digits : '';
}

export function buildEnquiryMessage(lines: EnquiryLine[], customer: { name?: string; place?: string } = {}) {
  const total = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
  const rows = lines.map((line) => `• ${line.name} (${line.variant}) × ${line.quantity} — ₹${(line.price * line.quantity).toLocaleString('en-IN')}`);
  return [
    'Hi Sudar Oli, I would like to order:',
    '',
    ...rows,
    '',
    `Items total: ₹${total.toLocaleString('en-IN')} (courier charge extra)`,
    customer.name ? `Name: ${customer.name}` : '',
    customer.place ? `Delivery to: ${customer.place}` : '',
    '',
    'Please confirm availability and send the payment QR.',
  ].filter((row, index, all) => row !== '' || (index > 0 && all[index - 1] !== '')).join('\n');
}

export function whatsappLink(number: string, message: string) {
  const digits = whatsappDigits(number);
  return digits ? `https://wa.me/${digits}?text=${encodeURIComponent(message)}` : '';
}

export function productEnquiryMessage(name: string, variant: string, quantity: number, price: number) {
  return buildEnquiryMessage([{ name, variant, quantity, price }]);
}
