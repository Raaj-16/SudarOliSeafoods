import { NextResponse } from 'next/server';
import { hashAuthToken, hashPassword } from '@/lib/password-auth';
import { hasDatabaseConfig, prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  if (!hasDatabaseConfig()) return NextResponse.json({ ok: false, message: 'Email verification is temporarily unavailable.' }, { status: 503 });
  const body = await request.json().catch(() => null);
  const token = typeof body?.token === 'string' ? body.token : '';
  const password = typeof body?.password === 'string' ? body.password : '';
  if (token.length < 32 || token.length > 128 || password.length < 12 || password.length > 128) {
    return NextResponse.json({ ok: false, message: 'This verification link is invalid or expired, or the password is too short.' }, { status: 400 });
  }

  const tokenHash = hashAuthToken(token);
  const authToken = await prisma.authToken.findFirst({
    where: { tokenHash, purpose: 'verify-email', expiresAt: { gt: new Date() } },
  });
  if (!authToken) return NextResponse.json({ ok: false, message: 'This verification link is invalid or expired.' }, { status: 400 });

  const passwordHash = await hashPassword(password);
  const verified = await prisma.$transaction(async (transaction) => {
    const consumed = await transaction.authToken.deleteMany({ where: { id: authToken.id } });
    if (consumed.count !== 1) return false;
    await transaction.user.update({ where: { id: authToken.userId }, data: { emailVerifiedAt: new Date(), passwordHash } });
    return true;
  });
  if (!verified) return NextResponse.json({ ok: false, message: 'This verification link is invalid or expired.' }, { status: 400 });
  return NextResponse.json({ ok: true, message: 'Email verified. You can now sign in.' });
}
