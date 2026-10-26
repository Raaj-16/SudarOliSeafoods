import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { prisma } from '@/lib/prisma';

const PASSWORD_KEY_LENGTH = 64;

function derivePassword(password: string, salt: string) {
  return new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, PASSWORD_KEY_LENGTH, { N: 16_384, r: 8, p: 1 }, (error, derivedKey) => {
      if (error) reject(error);
      else resolve(derivedKey);
    });
  });
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = await derivePassword(password, salt);
  return `scrypt$16384$8$1$${salt}$${derivedKey.toString('hex')}`;
}

export async function verifyPassword(password: string, encodedHash: string) {
  const [algorithm, cost, blockSize, parallelization, salt, expectedHex] = encodedHash.split('$');
  if (algorithm !== 'scrypt' || cost !== '16384' || blockSize !== '8' || parallelization !== '1' || !salt || !/^[a-f\d]{128}$/i.test(expectedHex || '')) {
    return false;
  }

  const actual = await derivePassword(password, salt);
  return timingSafeEqual(actual, Buffer.from(expectedHex, 'hex'));
}

export function hashAuthToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export async function createAuthToken(userId: string, purpose: string) {
  const token = randomBytes(32).toString('base64url');
  const tokenHash = hashAuthToken(token);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  await prisma.$transaction([
    prisma.authToken.deleteMany({ where: { userId, purpose } }),
    prisma.authToken.create({ data: { userId, purpose, tokenHash, expiresAt } }),
  ]);
  return token;
}

export async function sendAuthEmail(to: string, subject: string, text: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.AUTH_EMAIL_FROM;
  if (!apiKey || !from) throw new Error('Email delivery is not configured. Set RESEND_API_KEY and AUTH_EMAIL_FROM.');

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [to], subject, text, html }),
  });
  if (!response.ok) {
    console.error('Authentication email delivery failed with status:', response.status);
    throw new Error('Authentication email could not be delivered.');
  }
}

export function getAuthBaseUrl() {
  const configuredUrl = process.env.AUTH_BASE_URL;
  if (!configuredUrl) throw new Error('Set AUTH_BASE_URL to enable email-based authentication.');
  const url = new URL(configuredUrl);
  const isLocalHttp = url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname);
  if ((!isLocalHttp && url.protocol !== 'https:') || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('AUTH_BASE_URL must be a public HTTPS origin (or localhost for development).');
  }
  return url.origin;
}

export function escapeHtml(value: string) {
  const entities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return value.replace(/[&<>"']/g, (character) => entities[character]);
}
