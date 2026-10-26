import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { clearAuthFailures, isAuthRateLimited, recordAuthAttempt } from '@/lib/auth-throttle';
import { createSession, getAllowedAdminEmails, getAllowedAdminPhoneNumbers, normalizeEmail, normalizePhone, safeUser } from '@/lib/auth';
import { hasDatabaseConfig, prisma } from '@/lib/prisma';
import { hashAuthToken, verifyPassword } from '@/lib/password-auth';

export const runtime = 'nodejs';

const invalidCredentials = () => NextResponse.json({ ok: false, message: 'Invalid credentials.' }, { status: 401 });

export async function POST(request: Request) {
  if (!hasDatabaseConfig()) return NextResponse.json({ ok: false, message: 'Sign-in is temporarily unavailable.' }, { status: 503 });

  const body = await request.json().catch(() => null);
  const identifier = typeof body?.identifier === 'string' ? body.identifier.trim() : '';
  const password = typeof body?.password === 'string' ? body.password : '';
  if (!identifier || !password || password.length > 128) return invalidCredentials();

  const phone = normalizePhone(identifier);
  const isPhoneLogin = Boolean(phone && /^\+91\d{10}$/.test(phone));
  const email = normalizeEmail(identifier);
  const normalizedIdentifier = isPhoneLogin ? phone! : email;
  if (!normalizedIdentifier) return invalidCredentials();

  try {
    if (await isAuthRateLimited(normalizedIdentifier)) {
      return NextResponse.json({ ok: false, message: 'Too many sign-in attempts. Please wait 15 minutes and try again.' }, { status: 429 });
    }

    if (isPhoneLogin) {
      const configuredPassword = process.env.ADMIN_PASSWORD;
      const allowedAdminPhones = getAllowedAdminPhoneNumbers();
      const validPassword = configuredPassword && configuredPassword.length >= 16 &&
        timingSafeEqual(Buffer.from(hashAuthToken(password), 'hex'), Buffer.from(hashAuthToken(configuredPassword), 'hex'));
      if (!allowedAdminPhones.includes(phone!) || !validPassword) {
        await recordAuthAttempt(normalizedIdentifier);
        return invalidCredentials();
      }

      const user = await prisma.user.upsert({
        where: { phone: phone! },
        update: {},
        create: { phone: phone!, name: 'Shop Administrator' },
      });
      await clearAuthFailures(normalizedIdentifier);
      await createSession(user.id);
      return NextResponse.json({
        ok: true,
        user: safeUser({ ...user, isAdmin: true }),
        redirectTo: '/admin/products',
      });
    }

    const user = await prisma.user.findUnique({ where: { email: email! } });
    const validPassword = Boolean(user?.passwordHash && user.emailVerifiedAt && await verifyPassword(password, user.passwordHash));
    if (!user || !validPassword) {
      await recordAuthAttempt(normalizedIdentifier);
      return invalidCredentials();
    }

    await clearAuthFailures(normalizedIdentifier);
    const isAdmin = getAllowedAdminEmails().includes(email!);
    await createSession(user.id);
    return NextResponse.json({
      ok: true,
      user: safeUser({ ...user, isAdmin }),
      redirectTo: isAdmin ? '/admin/products' : '/',
    });
  } catch (error) {
    console.error('Sign-in failed:', error instanceof Error ? error.message : 'unknown error');
    return NextResponse.json({ ok: false, message: 'Sign-in is temporarily unavailable.' }, { status: 503 });
  }
}
