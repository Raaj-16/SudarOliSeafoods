import { NextResponse } from 'next/server';
import { clearAuthFailures, isAuthRateLimited, recordAuthAttempt } from '@/lib/auth-throttle';
import { hashAuthToken, hashPassword } from '@/lib/password-auth';
import { hasDatabaseConfig, prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  if (!hasDatabaseConfig()) return NextResponse.json({ ok: false, message: 'Password reset is temporarily unavailable.' }, { status: 503 });
  const body = await request.json().catch(() => null);
  const token = typeof body?.token === 'string' ? body.token : '';
  const password = typeof body?.password === 'string' ? body.password : '';
  if (token.length < 32 || token.length > 128 || password.length < 12 || password.length > 128) {
    return NextResponse.json({ ok: false, message: 'The reset link is invalid or expired, or the password is too short.' }, { status: 400 });
  }

  try {
    if (await isAuthRateLimited(token)) {
      return NextResponse.json({ ok: false, message: 'Too many reset attempts. Please request a new link.' }, { status: 429 });
    }
    const authToken = await prisma.authToken.findFirst({
      where: { tokenHash: hashAuthToken(token), purpose: 'reset-password', expiresAt: { gt: new Date() } },
    });
    if (!authToken) {
      await recordAuthAttempt(token);
      return NextResponse.json({ ok: false, message: 'The reset link is invalid or expired.' }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);
    await prisma.$transaction(async (transaction) => {
      const consumed = await transaction.authToken.deleteMany({ where: { id: authToken.id } });
      if (consumed.count !== 1) throw new Error('Reset token was already used.');
      await transaction.user.update({ where: { id: authToken.userId }, data: { passwordHash } });
      await transaction.session.deleteMany({ where: { userId: authToken.userId } });
      await transaction.authToken.deleteMany({ where: { userId: authToken.userId, purpose: 'reset-password' } });
    });
    await clearAuthFailures(token);
    return NextResponse.json({ ok: true, message: 'Password updated. You can now sign in.' });
  } catch (error) {
    console.error('Password reset failed:', error instanceof Error ? error.message : 'unknown error');
    return NextResponse.json({ ok: false, message: 'We could not reset your password. Please request a new link.' }, { status: 503 });
  }
}
