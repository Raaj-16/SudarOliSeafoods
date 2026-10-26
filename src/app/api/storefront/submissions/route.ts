import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

function cleanText(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function normalizePhone(value: unknown) {
  return cleanText(value, 40).replace(/[\s()+.-]/g, '');
}

function validPhone(phone: string) {
  return /^\d{10,15}$/.test(phone);
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ ok: false, message: 'Online inquiries are not configured yet. Please contact the shop by phone.' }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ ok: false, message: 'Invalid submission.' }, { status: 400 });
  }

  const kind = body.kind === 'bulk' ? 'bulk' : null;
  const customer = body.customer && typeof body.customer === 'object' && !Array.isArray(body.customer) ? body.customer : {};
  const customerName = cleanText(customer.name, 100);
  const customerPhone = normalizePhone(customer.phone);
  const customerEmail = cleanText(customer.email, 254);
  const business = cleanText(customer.business, 120);
  const location = cleanText(customer.location, 240);
  const notes = cleanText(body.notes, 1200);

  if (!kind || !customerName || !validPhone(customerPhone)) {
    return NextResponse.json({ ok: false, message: 'Please provide your name, a valid phone number, and a valid submission type.' }, { status: 400 });
  }
  const recentPhoneSubmissions = await prisma.storefrontSubmission.count({
    where: { kind: 'bulk', customerPhone, createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) } },
  });
  if (recentPhoneSubmissions >= 3) return NextResponse.json({ ok: false, message: 'Too many requests from this phone number. Please wait before trying again.' }, { status: 429 });
  if (customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
    return NextResponse.json({ ok: false, message: 'Please enter a valid email address.' }, { status: 400 });
  }
  if (!Array.isArray(body.items) || body.items.length < 1 || body.items.length > 20) {
    return NextResponse.json({ ok: false, message: 'Please select at least one item.' }, { status: 400 });
  }

  const resolvedItems: Array<{ productId: string; name: string; variant: string; quantity: number; unitPrice: number }> = [];
  for (const item of body.items) {
    if (!item || typeof item !== 'object') {
      return NextResponse.json({ ok: false, message: 'An item in this submission is invalid.' }, { status: 400 });
    }
    const product = await prisma.product.findUnique({ where: { slug: cleanText(item.productId, 160), isActive: true }, include: { category: true, variants: true } });
    if (!product) {
      return NextResponse.json({ ok: false, message: 'A selected product is unavailable. Please refresh and try again.' }, { status: 409 });
    }
    if (product.category.name !== 'Raw') {
      return NextResponse.json({ ok: false, message: 'Bulk inquiries can only include raw fish.' }, { status: 400 });
    }
    const quantity = Number(item.quantityKg);
    if (!Number.isInteger(quantity) || quantity < 2 || quantity > 1000 || quantity % 2 !== 0 || !product.variants.some((variant) => variant.stockQty > 0)) {
      return NextResponse.json({ ok: false, message: `Bulk quantities for ${product.name} must use 2 kg steps.` }, { status: 400 });
    }
    resolvedItems.push({ productId: product.id, name: product.name, variant: 'Bulk', quantity, unitPrice: 0 });
  }

  const subtotalPaise = resolvedItems.reduce((sum, item) => sum + item.unitPrice * item.quantity * 100, 0);
  const user = await getAuthenticatedUser();
  const payload = {
    customer: { name: customerName, phone: customerPhone, email: customerEmail || null, business: business || null, location: location || null },
    items: resolvedItems,
    notes: notes || null,
    subtotalPaise,
  };

  try {
    const submission = await prisma.storefrontSubmission.create({
      data: { userId: user?.id, kind, customerName, customerPhone, customerEmail: customerEmail || null, payload },
    });

    return NextResponse.json({
      ok: true,
      submissionId: submission.id,
      message: 'Your bulk inquiry has been received.',
      notificationStatus: 'disabled',
    }, { status: 201 });
  } catch (error) {
    console.error('Storefront submission could not be saved:', error instanceof Error ? error.message : 'unknown error');
    return NextResponse.json({ ok: false, message: 'We could not save your request. Please try again in a moment.' }, { status: 500 });
  }
}
