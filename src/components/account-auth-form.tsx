'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, UserRound } from 'lucide-react';

type FormMode = 'signin' | 'register' | 'forgot';

const loginMessages: Record<string, string> = {
  oauth_not_configured: 'Google sign-in is not configured. Please use your account credentials or contact the shop.',
  oauth_denied: 'Google sign-in was cancelled. Please try again.',
  oauth_failed: 'Google sign-in failed. Please try again or check the provider configuration.',
  database_not_configured: 'Sign-in is temporarily unavailable because the database is not configured.',
  invalid_verification: 'This email verification link is invalid or expired. Please register again.',
};

export function AccountAuthForm({ oauthError, verified, passwordReset }: { oauthError?: string; verified?: boolean; passwordReset?: boolean }) {
  const router = useRouter();
  const [mode, setMode] = useState<FormMode>('signin');
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(verified ? 'Your email is verified. Sign in to continue.' : passwordReset ? 'Your password was updated. Sign in with your new password.' : '');
  const [isSuccess, setIsSuccess] = useState(Boolean(verified || passwordReset));

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    setIsSuccess(false);

    const endpoint = mode === 'register' ? '/api/auth/register' : mode === 'forgot' ? '/api/auth/forgot-password' : '/api/auth/login';
    const payload = mode === 'register'
      ? { name, email: identifier }
      : mode === 'forgot'
        ? { email: identifier }
        : { identifier, password };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) throw new Error(result.message || 'Unable to complete this request. Please try again.');

      setIsSuccess(true);
      setMessage(result.message || 'Request complete.');
      if (mode === 'signin') {
        router.replace(result.redirectTo || '/');
        router.refresh();
      } else if (mode === 'register') {
        setMode('signin');
        setName('');
        setIdentifier('');
        setPassword('');
      } else {
        setIdentifier('');
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to complete this request. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function startGoogleSignIn() {
    setBusy(true);
    try {
      window.location.assign(new URL('/api/auth/google', window.location.origin).toString());
    } catch (error) {
      setBusy(false);
      setMessage(error instanceof Error ? error.message : 'Google sign-in could not be started.');
    }
  }

  const messageText = message || (oauthError ? loginMessages[oauthError] : '');

  return (
    <section className="section">
      <div className="wrap" style={{ maxWidth: 520 }}>
        <div className="eyebrow" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {mode === 'signin' ? <Shield size={14} /> : <UserRound size={14} />} Sudar Oli account
        </div>
        <h1 style={{ fontSize: 32, marginBottom: 8, lineHeight: 1.15 }}>
          {mode === 'signin' ? 'Sign in' : mode === 'register' ? 'Create your account' : 'Reset your password'}
        </h1>
        <p style={{ color: 'var(--ink-soft)', lineHeight: 1.5, marginBottom: 24, fontSize: 14 }}>
          {mode === 'signin'
            ? 'Administrators sign in with their registered phone and password. Customers sign in with their verified email and password.'
            : mode === 'register'
              ? 'Enter your email and name. We will send a verification link where you can choose your password.'
              : 'Enter your account email and we will send a password reset link if an account exists.'}
        </p>

        <form onSubmit={submit} autoComplete="off" className="bulk-form" style={{ display: 'grid', gap: 14 }}>
          {mode === 'register' && (
            <label>
              Name
              <input name="account-name" type="text" value={name} maxLength={100} required autoComplete="off" onChange={(event) => setName(event.target.value)} />
            </label>
          )}
          <label>
            {mode === 'signin' ? 'Phone number or customer email' : 'Email'}
            <input
              name="account-identifier"
              type="text"
              inputMode={mode === 'signin' ? 'text' : 'email'}
              value={identifier}
              maxLength={254}
              required
              autoComplete="off"
              spellCheck={false}
              onChange={(event) => setIdentifier(event.target.value)}
            />
          </label>
          {mode === 'signin' && (
            <label>
              Password
              <input
                name="account-password"
                type="password"
                value={password}
                maxLength={128}
                required
                autoComplete="new-password"
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
          )}

          <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
            {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : mode === 'register' ? 'Create account' : 'Send reset link'}
          </button>
        </form>

        <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 14, fontSize: 13 }}>
          {mode === 'signin' && (
            <>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => { setMode('register'); setMessage(''); }}>Create customer account</button>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => { setMode('forgot'); setMessage(''); }}>Forgot password?</button>
            </>
          )}
          {mode !== 'signin' && <button type="button" className="btn btn-outline btn-sm" onClick={() => { setMode('signin'); setMessage(''); }}>Back to sign in</button>}
        </div>

        {mode === 'signin' && (
          <div style={{ marginTop: 18, borderTop: '1px solid var(--line)', paddingTop: 18 }}>
            <button className="btn btn-outline btn-block" type="button" disabled={busy} onClick={startGoogleSignIn}>
              Continue with Google
            </button>
          </div>
        )}

        {messageText && (
          <p
            role="status"
            aria-live="polite"
            style={{
              marginTop: 16,
              padding: '10px 14px',
              borderRadius: 'var(--radius)',
              fontSize: 13,
              background: isSuccess ? '#ecfdf5' : '#fef2f2',
              color: isSuccess ? '#065f46' : '#991b1b',
              border: `1px solid ${isSuccess ? '#a7f3d0' : '#fecaca'}`,
            }}
          >
            {messageText}
          </p>
        )}
      </div>
    </section>
  );
}
