'use client';

import { startTransition, useEffect, useState } from 'react';

type Settings = {
  shippingPaise: number | '';
  businessName: string;
  address: string;
  mapUrl: string;
  phoneNumbers: string[];
  email: string;
  hours: string;
  whatsappNumber: string;
  instagramUrl: string;
  facebookUrl: string;
  fssaiLicense: string;
  heroStats: Array<{ value: string; label: string }>;
  trustItems: string[];
};

const emptySettings: Settings = { shippingPaise: '', businessName: '', address: '', mapUrl: '', phoneNumbers: [], email: '', hours: '', whatsappNumber: '', instagramUrl: '', facebookUrl: '', fssaiLicense: '', heroStats: [], trustItems: [] };

export function AdminSettingsManager() {
  const [settings, setSettings] = useState<Settings>(emptySettings);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    void fetch('/api/admin/settings', { cache: 'no-store', signal: controller.signal }).then((response) => response.json()).then((result) => {
      startTransition(() => {
        if (!result.ok) setMessage(result.message || 'Could not load settings.');
        else if (result.settings) setSettings({ ...emptySettings, ...result.settings, phoneNumbers: Array.isArray(result.settings.phoneNumbers) ? result.settings.phoneNumbers : [], heroStats: Array.isArray(result.settings.heroStats) ? result.settings.heroStats : [], trustItems: Array.isArray(result.settings.trustItems) ? result.settings.trustItems : [] });
        setLoaded(true);
      });
    }).catch(() => startTransition(() => { setMessage('Could not load settings.'); setLoaded(true); }));
    return () => controller.abort();
  }, []);

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const response = await fetch('/api/admin/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...settings, shippingPaise: Number(settings.shippingPaise) }) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) throw new Error(result.message || 'Could not save settings.');
      setMessage('Store settings saved. They are now used by the storefront and WhatsApp enquiries.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save settings.');
    } finally {
      setSaving(false);
    }
  }

  if (!loaded) return <p role="status">Loading store settings…</p>;

  return <form className="bulk-form" onSubmit={save}>
    <label>Business name<input value={settings.businessName} onChange={(event) => update('businessName', event.target.value)} /></label>
    <label>Business address<textarea rows={3} value={settings.address} onChange={(event) => update('address', event.target.value)} /></label>
    <label>Map link<input type="url" value={settings.mapUrl} onChange={(event) => update('mapUrl', event.target.value)} placeholder="https://…" /></label>
    <label>Phone numbers, one per line<textarea rows={3} value={settings.phoneNumbers.join('\n')} onChange={(event) => update('phoneNumbers', event.target.value.split('\n').map((phone) => phone.trim()).filter(Boolean))} /></label>
    <label>Email<input type="email" value={settings.email} onChange={(event) => update('email', event.target.value)} /></label>
    <label>Opening hours<input value={settings.hours} onChange={(event) => update('hours', event.target.value)} /></label>
    <label>WhatsApp business number, digits only<input inputMode="numeric" value={settings.whatsappNumber} onChange={(event) => update('whatsappNumber', event.target.value.replace(/\D/g, ''))} /></label>
    <label>Instagram URL<input type="url" value={settings.instagramUrl} onChange={(event) => update('instagramUrl', event.target.value)} placeholder="https://…" /></label>
    <label>Facebook URL<input type="url" value={settings.facebookUrl} onChange={(event) => update('facebookUrl', event.target.value)} placeholder="https://…" /></label>
    <label>FSSAI license number<input value={settings.fssaiLicense} onChange={(event) => update('fssaiLicense', event.target.value)} /></label>
    <label>Homepage metrics, one “value | label” per line<textarea rows={3} value={settings.heroStats.map((item) => `${item.value} | ${item.label}`).join('\n')} onChange={(event) => update('heroStats', event.target.value.split('\n').map((line) => { const [value, ...label] = line.split('|'); return { value: value?.trim() || '', label: label.join('|').trim() }; }).filter((item) => item.value && item.label).slice(0, 3))} /></label>
    <label>Trust strip items, one per line<textarea rows={4} value={settings.trustItems.join('\n')} onChange={(event) => update('trustItems', event.target.value.split('\n').map((item) => item.trim()).filter(Boolean).slice(0, 4))} /></label>
    <label>Courier charge (rupees)<input type="number" min="0" step="1" value={settings.shippingPaise === '' ? '' : settings.shippingPaise / 100} onChange={(event) => update('shippingPaise', event.target.value === '' ? '' : Math.round(Number(event.target.value) * 100))} required /></label>
    {message && <p role="status" aria-live="polite">{message}</p>}
    <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save store settings'}</button>
  </form>;
}
