import { createHash } from 'node:crypto';
import { prisma } from '@/lib/prisma';

const WINDOW_MINUTES = 15;
const MAX_ATTEMPTS = 5;

function identifierHash(identifier: string) {
  return createHash('sha256').update(identifier.trim().toLowerCase()).digest('hex');
}

function getWindowStart(now: Date) {
  const bucket = new Date(now);
  bucket.setSeconds(0, 0);
  return bucket;
}

export async function isAuthRateLimited(identifier: string) {
  const since = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000);
  const attempts = await prisma.authAttempt.aggregate({
    where: { identifierHash: identifierHash(identifier), bucketStart: { gte: since } },
    _sum: { attempts: true },
  });
  return (attempts._sum.attempts ?? 0) >= MAX_ATTEMPTS;
}

export async function recordAuthAttempt(identifier: string) {
  const now = new Date();
  const hashedIdentifier = identifierHash(identifier);
  const bucketStart = getWindowStart(now);
  await prisma.authAttempt.upsert({
    where: { identifierHash_bucketStart: { identifierHash: hashedIdentifier, bucketStart } },
    create: { identifierHash: hashedIdentifier, bucketStart, attempts: 1 },
    update: { attempts: { increment: 1 } },
  });
  if (now.getMinutes() === 0) {
    await prisma.authAttempt.deleteMany({ where: { bucketStart: { lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) } } });
  }
}

export async function clearAuthFailures(identifier: string) {
  await prisma.authAttempt.deleteMany({ where: { identifierHash: identifierHash(identifier) } });
}
