import Link from 'next/link';
import Image from 'next/image';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';

const steps = [
  { number: '01', title: 'The catch comes in', description: 'Boats land at first light. We buy directly from crews along the Tamil Nadu coast — nothing frozen, nothing held over from a previous day.', image: '/process/catching.jpeg' },
  { number: '02', title: 'Cleaned within hours', description: "Fish is gutted, scaled and rinsed the same morning it's landed. Bigger fish like vanjaram and soora are cut into steaks at this stage.", image: '/process/cleaning.jpeg' },
  { number: '03', title: 'Hand-salted', description: 'Rock salt is rubbed in by hand at a ratio tuned to each fish — enough to preserve and season, not so much that it overpowers the cooking.', image: '/process/Salting.jpeg' },
  { number: '04', title: 'Racked in open sun', description: 'Laid out on bamboo racks and turned twice a day. Depending on the fish and the weather, this takes three to five days — no shortcuts, no machine dryers.', image: '/process/Drying.jpeg' },
  { number: '05', title: 'Packed & shipped', description: 'Sorted by weight, vacuum-sealed in food-grade pouches, and shipped out — Chennai orders the same evening, other Tamil Nadu districts in 2–3 days.', image: '/process/packing.jpeg' },
];

export const dynamic = 'force-dynamic';

export default function HowWeDryPage() {
  return (
    <>
      <SiteHeader />
      <main id="view-process">
        <div className="wrap" style={{ paddingTop: 26 }}>
          <div className="breadcrumb"><Link href="/">Home</Link> / <span>How We Dry It</span></div>
          <section style={{ maxWidth: 720, marginBottom: 44 }}>
            <div className="eyebrow">Our process</div>
            <h1 style={{ fontSize: 'clamp(28px,4vw,42px)', lineHeight: 1.08 }}>From the boat to the rack, in a Week.</h1>
            <p className="lead" style={{ marginTop: 16 }}>No chemical dryers, no bleaching agents, no cold-storage shortcuts. Every batch of Sudar Oli dry fish goes through the same five steps our families have used along the Tamil Nadu coast for generations — which is also why some weeks a variety sells out rather than being restocked on demand.</p>
          </section>
          <div className="process-steps">
            {steps.map((step) => (
              <article className="pstep" key={step.number}>
                <div className="pstep-n">{step.number}</div>
                <div className="pstep-ico"><Image src={step.image} alt="" width={600} height={300} /></div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </article>
            ))}
          </div>
          <section style={{ maxWidth: 720, margin: '50px 0', padding: 24, background: 'var(--sand-deep)', borderRadius: 'var(--radius)' }}>
            <h3 style={{ fontSize: 18, marginBottom: 10 }}>Why stock runs out sometimes</h3>
            <p style={{ color: 'var(--ink-soft)', fontSize: 14.5, lineHeight: 1.65 }}>Because everything here depends on the catch, the weather and a multi-day drying window, we never hold more stock than what actually comes off the racks. When a variety sells out on the shop page, it&apos;s genuinely out — not a pricing trick. Ask us on WhatsApp about the next batch and we&apos;ll confirm when it is ready.</p>
          </section>
          <div style={{ marginBottom: 60 }}><Link className="btn btn-primary" href="/products">Shop today&apos;s rack</Link></div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
