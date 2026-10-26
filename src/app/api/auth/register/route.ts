import { NextResponse } from 'next/server';
import { createAuthToken, escapeHtml, getAuthBaseUrl, sendAuthEmail } from '@/lib/password-auth';
import { isAuthRateLimited, recordAuthAttempt } from '@/lib/auth-throttle';
import { normalizeEmail } from '@/lib/auth';
import { hasDatabaseConfig, prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  if (!hasDatabaseConfig()) return NextResponse.json({ ok: false, message: 'Account registration is temporarily unavailable.' }, { status: 503 });

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === 'string' ? body.name.trim().slice(0, 100) : '';
  const email = normalizeEmail(body?.email);
  if (!name || !email || (typeof body?.email === 'string' && body.email.length > 254)) {
    return NextResponse.json({ ok: false, message: 'Enter your name and a valid email address.' }, { status: 400 });
  }
  if (!process.env.RESEND_API_KEY || !process.env.AUTH_EMAIL_FROM || !process.env.AUTH_BASE_URL) {
    return NextResponse.json({ ok: false, message: 'Email verification is not configured. Please try again later or contact the shop.' }, { status: 503 });
  }

  try {
    if (await isAuthRateLimited(email)) {
      return NextResponse.json({ ok: false, message: 'Too many account requests. Please wait and try again.' }, { status: 429 });
    }
    await recordAuthAttempt(email);
    const user = await prisma.user.findUnique({ where: { email } });
    if (user?.emailVerifiedAt) return NextResponse.json({ ok: true, message: 'If this address can be registered, a verification email will be sent.' }, { status: 202 });

    const account = user ?? await prisma.user.create({ data: { name, email } });

    const baseUrl = getAuthBaseUrl();
    const token = await createAuthToken(account.id, 'verify-email');
    await sendAuthEmail(
      email,
      'Verify your Sudar Oli account',
      `Verify your email address: ${baseUrl}/verify-email?token=${encodeURIComponent(token)}`,
      `<p>Hello ${escapeHtml(account.name || name)},</p><p>Verify your email address and choose a password to finish creating your Sudar Oli account:</p><p><a href="${baseUrl}/verify-email?token=${encodeURIComponent(token)}">Verify email</a></p><p>This link expires in one hour.</p>`,
    );
    return NextResponse.json({ ok: true, message: 'If this address can be registered, a verification link will be sent.' }, { status: 202 });
  } catch (error) {
    console.error('Account registration failed:', error instanceof Error ? error.message : 'unknown error');
    return NextResponse.json({ ok: false, message: 'We could not create your account right now. Please try again.' }, { status: 503 });
  }
}
