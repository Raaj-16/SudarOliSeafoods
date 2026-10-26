import { NextResponse } from 'next/server';
import { destroySession, getAuthenticatedUser, safeUser } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET() {
  const user = await getAuthenticatedUser();
  return NextResponse.json({ ok: true, user: user ? safeUser(user) : null });
}

export async function DELETE() {
  await destroySession();
  return NextResponse.json({ ok: true });
}
