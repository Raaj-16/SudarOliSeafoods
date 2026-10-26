import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUser } from '@/lib/auth';
import { hasDatabaseConfig, prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

const bodySchema = z.object({
  name: z.string().trim().max(100).optional(),
  place: z.string().trim().max(160).optional(),
  items: z.array(z.object({
    productId: z.string().trim().min(1).max(160),
    variant: z.string().trim().min(1).max(32),
    quantity: z.number().int().min(1).max(20),
  })).min(1).max(20),
});

// Best-effort log of a WhatsApp enquiry so the shop can see what customers asked for.
// It never changes stock: the shop confirms availability on WhatsApp and updates stock in the admin portal.
export async function POST(request: Request) {
  if (!hasDatabaseConfig()) return NextResponse.json({ ok: true, logged: false });
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, message: 'Invalid enquiry.' }, { status: 400 });

  try {
    const recent = await prisma.storefrontSubmission.count({ where: { kind: 'enquiry', createdAt: { gte: new Date(Date.now() - 60 * 1000) } } });
    if (recent >= 60) return NextResponse.json({ ok: true, logged: false });

    const items: Array<{ name: string; variant: string; quantity: number; unitPrice: number }> = [];
    for (const item of parsed.data.items) {
      const variant = await prisma.productVariant.findFirst({ where: { label: item.variant, product: { slug: item.productId, isActive: true } }, include: { product: true } });
      if (variant) items.push({ name: variant.product.name, variant: variant.label, quantity: item.quantity, unitPrice: variant.pricePaise / 100 });
    }
    if (!items.length) return NextResponse.json({ ok: true, logged: false });

    const user = await getAuthenticatedUser();
    await prisma.storefrontSubmission.create({
      data: {
        userId: user?.id,
        kind: 'enquiry',
        customerName: user?.name || parsed.data.name || 'WhatsApp visitor',
        customerPhone: user?.phone || '',
        customerEmail: user?.email,
        payload: { items, place: parsed.data.place ?? '' },
        status: 'received',
      },
    });
    return NextResponse.json({ ok: true, logged: true });
  } catch (error) {
    console.error('Enquiry log failed:', error instanceof Error ? error.message : 'unknown error');
    return NextResponse.json({ ok: true, logged: false });
  }
}
