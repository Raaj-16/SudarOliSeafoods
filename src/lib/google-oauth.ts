export function getGoogleOAuthConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const configuredRedirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret) return null;
  if (!configuredRedirectUri && process.env.NODE_ENV === 'production') return null;

  const redirectUri = configuredRedirectUri || 'http://localhost:3000/api/auth/google/callback';

  try {
    const url = new URL(redirectUri);
    const localHttp = url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname);
    if (
      url.pathname !== '/api/auth/google/callback'
      || url.username
      || url.password
      || url.search
      || url.hash
      || (process.env.NODE_ENV === 'production' ? url.protocol !== 'https:' : !localHttp && url.protocol !== 'https:')
    ) {
      return null;
    }
  } catch {
    return null;
  }

  return { clientId, clientSecret, redirectUri };
}
