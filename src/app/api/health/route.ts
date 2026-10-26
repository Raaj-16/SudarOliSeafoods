import { NextResponse } from 'next/server';
import { hasDatabaseConfig, prisma } from '@/lib/prisma';

export async function GET() {
  if (!hasDatabaseConfig()) {
    return NextResponse.json(
      { ok: false, status: 'unhealthy', checks: { database: 'not_configured' } },
      { status: 503 },
    );
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, status: 'healthy', checks: { database: 'connected' } });
  } catch {
    return NextResponse.json(
      { ok: false, status: 'unhealthy', checks: { database: 'unavailable' } },
      { status: 503 },
    );
  }
}
