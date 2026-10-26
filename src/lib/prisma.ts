import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export function hasDatabaseConfig() {
  const value = process.env.DATABASE_URL?.trim() ?? '';
  if (!value) return false;
  return !value.includes('USER:PASSWORD@HOST') && !value.includes('replace-with-your');
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
