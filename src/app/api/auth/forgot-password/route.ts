import { NextResponse } from 'next/server';
import { normalizeEmail } from '@/lib/auth';
import { createAuthToken, getAuthBaseUrl, sendAuthEmail } from '@/lib/password-auth';
import { isAuthRateLimited, recordAuthAttempt } from '@/lib/auth-throttle';
import { hasDatabaseConfig, prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  if (!hasDatabaseConfig()) return NextResponse.json({ ok: false, message: 'Password recovery is temporarily unavailable.' }, { status: 503 });
  if (!process.env.RESEND_API_KEY || !process.env.AUTH_EMAIL_FROM || !process.env.AUTH_BASE_URL) {
    return NextResponse.json({ ok: false, message: 'Password recovery email is not configured. Please contact the shop.' }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const email = normalizeEmail(body?.email);
  if (!email) return NextResponse.json({ ok: false, message: 'Enter a valid email address.' }, { status: 400 });

  try {
    if (await isAuthRateLimited(email)) {
      return NextResponse.json({ ok: true, message: 'If an account exists for this email, a password reset link will be sent.' });
    }
    await recordAuthAttempt(email);
    const user = await prisma.user.findUnique({ where: { email } });
    if (user?.passwordHash && user.emailVerifiedAt) {
      const token = await createAuthToken(user.id, 'reset-password');
      const baseUrl = getAuthBaseUrl();
      await sendAuthEmail(
        email,
        'Reset your Sudar Oli password',
        `Reset your password: ${baseUrl}/reset-password?token=${encodeURIComponent(token)}`,
        `<p>Use the link below to reset your Sudar Oli password:</p><p><a href="${baseUrl}/reset-password?token=${encodeURIComponent(token)}">Reset password</a></p><p>This link expires in one hour. If you did not request this, ignore this email.</p>`,
      );
    }
    return NextResponse.json({ ok: true, message: 'If an account exists for this email, a password reset link will be sent.' });
  } catch (error) {
    console.error('Password reset request failed:', error instanceof Error ? error.message : 'unknown error');
    return NextResponse.json({ ok: false, message: 'We could not send a reset email right now. Please try again.' }, { status: 503 });
  }
}
