import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { getAttribution } from '@/lib/attribution';

// Public lead-intake endpoint on globalcrm (verify_jwt=false — no key needed,
// nothing secret in the bundle). Leads land in the In-Sync CRM, auto-assigned
// to the WorkSync calling agent. Mirrors DemoRequestModal's target.
const INTAKE_URL = 'https://ejzjrvazegaxrhqizgaa.supabase.co/functions/v1/web-lead-intake';

// Same role taxonomy as the full modal so we keep learning which roles convert
// and can tighten ad targeting. Optional here — only name + phone are required.
const DESIGNATIONS = [
  'Founder / Owner / Director',
  'CXO / VP / Head of Department',
  'Operations Manager',
  'Branch / Area Manager',
  'Team Lead / Supervisor',
  'Admin / HR',
  'Other',
];

const EMPTY = { name: '', phone: '', email: '', company: '', designation: '', _hp: '' };

/**
 * Compact demo-request form designed to sit IN the hero (first frame) so the ad
 * visitor can convert without a click-through to a modal. Trimmed to the minimum
 * that still lets the team call back (name + phone required); timing, team size
 * and other qualification happen on that call. Keeps attribution, honeypot and
 * the GA4 conversion signal identical to DemoRequestModal.
 */
export function HeroLeadForm() {
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });

  const field =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim() || !form.email.trim()) {
      toast.error('Please add your name, phone number and email.');
      return;
    }
    setSubmitting(true);
    try {
      const attr = getAttribution();
      const res = await fetch(INTAKE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product: 'Worksync',
          name: form.name,
          phone: form.phone,
          email: form.email,
          company: form.company,
          designation: form.designation,
          _hp: form._hp,
          gclid: attr.gclid,
          utm_source: attr.utm_source,
          utm_medium: attr.utm_medium,
          utm_campaign: attr.utm_campaign,
          source_url: window.location.href,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      // GA4 conversion signal — identical to the modal so reporting is unified.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const gtag = (window as any).gtag;
      if (typeof gtag === 'function') {
        gtag('event', 'generate_lead', {
          product_key: 'worksync',
          form_type: 'demo',
          cta_label: 'hero_inline_demo',
        });
      }
      setDone(true);
    } catch {
      toast.error('Something went wrong. Please try again, or email us at hello@in-sync.co.in.');
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border bg-card/80 p-8 text-center shadow-xl shadow-primary/5 backdrop-blur">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
          <CheckCircle className="h-6 w-6 text-emerald-500" />
        </div>
        <h3 className="text-lg font-semibold">Thanks — we'll be in touch shortly</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Our team will call you to understand your needs and set up your WorkSync demo.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-card/80 p-6 shadow-xl shadow-primary/5 backdrop-blur sm:p-7">
      <h3 className="text-lg font-semibold">Get a free demo</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Leave your details — we'll call to arrange a time that suits you.
      </p>

      <form onSubmit={submit} className="mt-4 space-y-3">
        <Input placeholder="Your name *" value={form.name} onChange={field('name')} required />
        <Input
          placeholder="Phone *"
          value={form.phone}
          onChange={field('phone')}
          inputMode="tel"
          required
        />
        <Input
          type="email"
          placeholder="Work email *"
          value={form.email}
          onChange={field('email')}
          required
        />
        <Input placeholder="Company" value={form.company} onChange={field('company')} />

        <select
          value={form.designation}
          onChange={field('designation')}
          aria-label="Your role"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Your role (optional)</option>
          {DESIGNATIONS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        {/* Honeypot — hidden from humans; bots that fill it are silently dropped. */}
        <input
          type="text"
          name="company_website"
          value={form._hp}
          onChange={field('_hp')}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
        />

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? (
            'Sending…'
          ) : (
            <>
              Request my demo <ArrowRight className="ml-1 h-4 w-4" />
            </>
          )}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          No spam — we'll only use this to arrange your demo.
        </p>
      </form>
    </div>
  );
}
