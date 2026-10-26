import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

function clean(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) return NextResponse.json({ ok: false, message: 'Contact submissions are not configured yet.' }, { status: 503 });
  const body = await request.json().catch(() => null);
  const name = clean(body?.name, 100);
  const email = clean(body?.email, 254);
  const phone = clean(body?.phone, 24).replace(/[\s()+.-]/g, '');
  const message = clean(body?.message, 2000);
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^\d{10,15}$/.test(phone) || !message) {
    return NextResponse.json({ ok: false, message: 'Enter your name, valid email and phone, and a message.' }, { status: 400 });
  }
  const recent = await prisma.storefrontSubmission.count({ where: { kind: 'contact', customerPhone: phone, createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) } } });
  if (recent >= 3) return NextResponse.json({ ok: false, message: 'Too many messages from this phone. Please wait and try again.' }, { status: 429 });
  const user = await getAuthenticatedUser();
  try {
    await prisma.storefrontSubmission.create({
      data: { userId: user?.id, kind: 'contact', customerName: name, customerPhone: phone, customerEmail: email, payload: { message } },
    });
    return NextResponse.json({ ok: true, notificationStatus: 'disabled' }, { status: 201 });
  } catch (error) {
    console.error('Contact submission failed:', error instanceof Error ? error.message : 'unknown error');
    return NextResponse.json({ ok: false, message: 'Could not save your message. Please try again.' }, { status: 500 });
  }
}
