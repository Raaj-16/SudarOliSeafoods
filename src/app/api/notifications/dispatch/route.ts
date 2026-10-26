import { NextResponse } from 'next/server';
import { validDispatchSecret } from '@/lib/messaging';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  if (!validDispatchSecret(request.headers.get('authorization'))) {
    return NextResponse.json({ ok: false, message: 'Unauthorized.' }, { status: 401 });
  }
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ ok: false, message: 'Database is not configured.' }, { status: 503 });
  }

  return NextResponse.json({ ok: true, sent: 0, failed: 0, skipped: true, disabled: true });
}

export async function GET(request: Request) {
  return POST(request);
}
