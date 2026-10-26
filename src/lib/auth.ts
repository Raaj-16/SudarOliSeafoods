import { createHash, randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { hasDatabaseConfig, prisma } from '@/lib/prisma';

export const SESSION_COOKIE = 'sudaroli_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

export function normalizeEmail(value: unknown) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) ? trimmed : null;
}

export function normalizePhone(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const digits = value.replace(/\D/g, '');
  if (!digits) return null;
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  if (digits.length === 11 && digits.startsWith('0')) return `+91${digits.slice(1)}`;
  return `+${digits}`;
}

export function getAllowedAdminEmails() {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((value) => normalizeEmail(value))
    .filter((value): value is string => Boolean(value));
}

export function getAllowedAdminPhoneNumbers(): string[] {
  return (process.env.ADMIN_PHONE_NUMBERS || '')
    .split(',')
    .map((value) => normalizePhone(value))
    .filter((value): value is string => Boolean(value));
}

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export async function createSession(userId: string) {
  const cookieStore = await cookies();
  if (!hasDatabaseConfig()) throw new Error('Database is required to create a session.');

  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);

  const token = randomBytes(32).toString('base64url');
  await prisma.session.create({ data: { userId, tokenHash: hashToken(token), expiresAt } });
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });
}

export async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token || !hasDatabaseConfig()) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });
  if (!session || session.expiresAt <= new Date()) return null;

  const email = normalizeEmail(session.user.email);
  const phone = normalizePhone(session.user.phone);
  const allowedPhones = getAllowedAdminPhoneNumbers();
  const allowedEmails = getAllowedAdminEmails();
  const isAdmin = Boolean(email && allowedEmails.includes(email)) ||
    Boolean(phone && allowedPhones.includes(phone));
  return { ...session.user, isAdmin };
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token && hasDatabaseConfig()) await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  cookieStore.delete(SESSION_COOKIE);
}

export function safeUser(user: NonNullable<Awaited<ReturnType<typeof getAuthenticatedUser>>>) {
  return {
    id: user.id,
    name: user.name,
    phone: user.phone,
    email: user.email,
    role: user.isAdmin ? 'admin' : 'customer',
  };
}
