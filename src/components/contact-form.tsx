'use client';

import { useState, type FormEvent } from 'react';

export function ContactForm() {
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setFeedback('');
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      const response = await fetch('/api/storefront/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.get('name'), email: form.get('email'), phone: form.get('phone'), message: form.get('message') }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) throw new Error(result.message || 'Could not send your message.');
      formElement.reset();
      setFeedback('Your message has been received.');
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Could not send your message.');
    } finally {
      setSubmitting(false);
    }
  }

  return <form className="bulk-form" onSubmit={submit}>
    <label>Name<input name="name" maxLength={100} required /></label>
    <label>Email<input name="email" type="email" maxLength={254} required /></label>
    <label>Phone<input name="phone" type="tel" minLength={10} maxLength={18} required /></label>
    <label>Message<textarea name="message" rows={5} maxLength={2000} required /></label>
    {feedback && <p role="status" aria-live="polite">{feedback}</p>}
    <button className="btn btn-primary" type="submit" disabled={submitting}>{submitting ? 'Sending…' : 'Send message'}</button>
  </form>;
}
