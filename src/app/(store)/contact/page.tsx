import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { ContactForm } from '@/components/contact-form';
import { getStorefrontSettings } from '@/lib/site-settings';

export const dynamic = 'force-dynamic';

export default async function ContactPage() {
  const settings = await getStorefrontSettings();
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="eyebrow">Contact</p>
            <h1 style={{ fontSize: 'clamp(30px,4vw,44px)', lineHeight: 1.08 }}>We&apos;re here to help with your order.</h1>
            <div style={{ marginTop: 28, color: 'var(--ink-soft)', lineHeight: 1.8 }}>
              {settings?.address && <p>{settings.mapUrl ? <a href={settings.mapUrl} target="_blank" rel="noreferrer">{settings.address}</a> : settings.address}</p>}
              {settings?.phoneNumbers.map((phone) => <p key={phone}><a href={`tel:${phone.replace(/\D/g, '')}`}>{phone}</a></p>)}
              {settings?.email && <p><a href={`mailto:${settings.email}`}>{settings.email}</a></p>}
              {settings?.hours && <p>{settings.hours}</p>}
              {!settings && <p>Store contact information is being configured.</p>}
            </div>
          </div>

          <ContactForm />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
