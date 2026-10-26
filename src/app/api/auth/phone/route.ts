import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST() {
  return NextResponse.json(
    { ok: false, message: 'This sign-in endpoint has been retired. Please use the secure sign-in form.' },
    { status: 410 },
  );
}
