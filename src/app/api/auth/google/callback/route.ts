import { NextResponse } from 'next/server';
import { createSession, getAllowedAdminEmails, normalizeEmail } from '@/lib/auth';
import { getGoogleOAuthConfig } from '@/lib/google-oauth';
import { hasDatabaseConfig, prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

async function ensureAdminSlot(userId: string, email: string) {
  const existing = await prisma.adminSlot.findUnique({ where: { userId } });
  if (existing) {
    await prisma.adminSlot.update({ where: { userId }, data: { identifier: email } });
    return;
  }

  const usedSlots = await prisma.adminSlot.findMany({ select: { slot: true }, orderBy: { slot: 'asc' } });
  const availableSlot = [1, 2, 3].find((slot) => !usedSlots.some((entry) => entry.slot === slot));
  if (availableSlot !== undefined) {
    await prisma.adminSlot.create({
      data: {
        slot: availableSlot,
        userId,
        identifier: email,
      },
    });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const baseUrl = new URL(request.url).origin;

  if (error) {
    return NextResponse.redirect(new URL('/login?error=oauth_denied', baseUrl));
  }

  const expectedState = request.headers.get('cookie')?.split(';').map((part) => part.trim()).find((part) => part.startsWith('sudaroli_oauth_state='))?.split('=')[1];
  const returnedState = searchParams.get('state');
  if (!expectedState || !returnedState || expectedState !== returnedState) {
    return NextResponse.redirect(new URL('/login?error=oauth_failed', baseUrl));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=missing_code', baseUrl));
  }

  const config = getGoogleOAuthConfig();
  if (!config) {
    return NextResponse.redirect(new URL('/login?error=oauth_not_configured', baseUrl));
  }

  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: config.redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Google token exchange failed.');
    }

    const tokenData = await tokenResponse.json() as { access_token?: string };
    const accessToken = tokenData.access_token;
    if (!accessToken) {
      throw new Error('Missing access token.');
    }

    const userResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userResponse.ok) {
      throw new Error('Google user lookup failed.');
    }

    const profile = await userResponse.json() as { email?: string; email_verified?: boolean; name?: string; given_name?: string; family_name?: string };
    const email = normalizeEmail(profile.email);
    if (!email || profile.email_verified !== true) {
      throw new Error('Google account email is missing or unverified.');
    }

    const allowedAdminEmails = getAllowedAdminEmails();
    const name = profile.name || profile.given_name || 'Google user';
    const isAdmin = allowedAdminEmails.includes(email);

    if (hasDatabaseConfig()) {
      const user = await prisma.user.upsert({
        where: { email },
        update: { name, emailVerifiedAt: new Date() },
        create: { email, name, emailVerifiedAt: new Date() },
      });

      if (isAdmin) {
        await ensureAdminSlot(user.id, email);
      }

      await createSession(user.id);
      const done = NextResponse.redirect(new URL(isAdmin ? '/admin/products' : '/', baseUrl));
      done.cookies.delete({ name: 'sudaroli_oauth_state', path: '/api/auth/google' });
      return done;
    }

    return NextResponse.redirect(new URL('/login?error=database_not_configured', baseUrl));
  } catch (error) {
    console.error('Google OAuth callback failed:', error instanceof Error ? error.message : 'unknown error');
    return NextResponse.redirect(new URL('/login?error=oauth_failed', baseUrl));
  }
}
