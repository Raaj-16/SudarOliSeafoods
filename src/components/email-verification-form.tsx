'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function EmailVerificationForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function verify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) throw new Error(result.message || 'Email verification failed.');
      router.replace('/login?verified=1');
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Email verification failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="section">
      <div className="wrap" style={{ maxWidth: 520 }}>
        <div className="eyebrow">Customer account</div>
        <h1 style={{ fontSize: 32, marginBottom: 8 }}>Verify email and choose a password</h1>
        <p style={{ color: 'var(--ink-soft)', lineHeight: 1.5, marginBottom: 24, fontSize: 14 }}>
          Confirm this email address and set a password of at least 12 characters to activate your account.
        </p>
        <form onSubmit={verify} autoComplete="off" className="bulk-form" style={{ display: 'grid', gap: 14 }}>
          <label>
            New password
            <input name="new-password" type="password" value={password} minLength={12} maxLength={128} required autoComplete="new-password" onChange={(event) => setPassword(event.target.value)} />
          </label>
          <button className="btn btn-primary btn-block" type="submit" disabled={busy || token.length < 32}>
            {busy ? 'Verifying…' : 'Verify email and create account'}
          </button>
          {token.length < 32 && <p role="alert">This verification link is invalid.</p>}
          {message && <p role="status" aria-live="polite">{message}</p>}
        </form>
      </div>
    </section>
  );
}
