import { randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getGoogleOAuthConfig } from '@/lib/google-oauth';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const config = getGoogleOAuthConfig();
  const baseUrl = new URL(request.url).origin;

  if (!config) {
    return NextResponse.redirect(new URL('/login?error=oauth_not_configured', baseUrl));
  }

  const state = randomBytes(24).toString('base64url');
  const params = new URLSearchParams({
    state,
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'consent',
  });

  const response = NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
  // Remember the state in a short-lived cookie so the callback can prove the sign-in started here.
  response.cookies.set('sudaroli_oauth_state', state, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/api/auth/google', maxAge: 600 });
  return response;
}
