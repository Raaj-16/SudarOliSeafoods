'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function PasswordResetForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) throw new Error(result.message || 'Could not reset your password.');
      router.replace('/login?passwordReset=1');
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not reset your password.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="section">
      <div className="wrap" style={{ maxWidth: 520 }}>
        <div className="eyebrow">Customer account</div>
        <h1 style={{ fontSize: 32, marginBottom: 8 }}>Choose a new password</h1>
        <p style={{ color: 'var(--ink-soft)', lineHeight: 1.5, marginBottom: 24, fontSize: 14 }}>Use at least 12 characters.</p>
        <form onSubmit={submit} autoComplete="off" className="bulk-form" style={{ display: 'grid', gap: 14 }}>
          <label>
            New password
            <input name="new-password" type="password" value={password} minLength={12} maxLength={128} required autoComplete="new-password" onChange={(event) => setPassword(event.target.value)} />
          </label>
          <button className="btn btn-primary btn-block" type="submit" disabled={busy || token.length < 32}>
            {busy ? 'Updating…' : 'Update password'}
          </button>
          {token.length < 32 && <p role="alert">This password reset link is invalid.</p>}
          {message && <p role="status" aria-live="polite">{message}</p>}
        </form>
      </div>
    </section>
  );
}
