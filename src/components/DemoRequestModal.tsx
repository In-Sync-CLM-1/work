import { useState, type FormEvent, type ReactNode } from 'react';
import { toast } from 'sonner';
import { ArrowRight, CheckCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogCloseButton,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { getAttribution } from '@/lib/attribution';

// Public lead-intake endpoint on globalcrm (verify_jwt=false — no key needed,
// nothing secret in the bundle). Leads land in the In-Sync CRM, auto-assigned
// to the WorkSync calling agent.
const INTAKE_URL = 'https://ejzjrvazegaxrhqizgaa.supabase.co/functions/v1/web-lead-intake';
const AVAILABILITY_URL = 'https://ejzjrvazegaxrhqizgaa.supabase.co/functions/v1/demo-availability';

// "11:00" -> "11:00 AM", "17:00" -> "5:00 PM"
function fmt12(t: string): string {
  const [h, m] = t.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}
const todayStr = () => new Date().toISOString().slice(0, 10);

const EMPTY = {
  name: '', phone: '', email: '', company: '', message: '', _hp: '',
  team_size: '', preferred_date: '', preferred_time: '',
};

/**
 * "Request a Demo" button + modal. Renders its own trigger button (styled via
 * `className`) so it can drop into the hero, header, and final CTA. On submit it
 * posts the lead — with captured gclid/utm — to the CRM intake endpoint.
 */
export function DemoRequestModal({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });
  const [slots, setSlots] = useState<{ time: string; available: boolean }[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Fetch the host's open demo slots for a date (greys out booked ones).
  async function loadSlots(date: string) {
    if (!date) { setSlots([]); return; }
    setLoadingSlots(true);
    try {
      const r = await fetch(`${AVAILABILITY_URL}?date=${encodeURIComponent(date)}`);
      const j = await r.json();
      setSlots(Array.isArray(j.slots) ? j.slots : []);
    } catch {
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }

  const field =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  function close(o: boolean) {
    setOpen(o);
    if (!o) {
      // reset after the close animation-ish; immediate is fine here
      setDone(false);
      setForm({ ...EMPTY });
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      toast.error('Please add your name and phone number.');
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
          message: form.message,
          team_size: form.team_size,
          preferred_date: form.preferred_date,
          preferred_time: form.preferred_time,
          _hp: form._hp,
          gclid: attr.gclid,
          utm_source: attr.utm_source,
          utm_medium: attr.utm_medium,
          utm_campaign: attr.utm_campaign,
          source_url: window.location.href,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      // GA4 conversion signal (mirrors the existing trial-signup lead event).
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const gtag = (window as any).gtag;
      if (typeof gtag === 'function') {
        gtag('event', 'generate_lead', {
          product_key: 'worksync',
          form_type: 'demo',
          cta_label: 'request_a_demo',
        });
      }
      setDone(true);
    } catch {
      toast.error('Something went wrong. Please try again, or email us at hello@in-sync.co.in.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        {children}
      </button>

      <Dialog open={open} onOpenChange={close}>
        <DialogContent className="relative">
          <DialogCloseButton onClick={() => close(false)} />

          {done ? (
            <div className="py-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
                <CheckCircle className="h-6 w-6 text-emerald-500" />
              </div>
              <DialogTitle>Thanks — we'll be in touch shortly</DialogTitle>
              <DialogDescription className="mt-2">
                Our team will call you to understand your needs and set up your WorkSync demo.
              </DialogDescription>
              <Button className="mt-6" onClick={() => close(false)}>
                Done
              </Button>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Request a demo</DialogTitle>
                <DialogDescription>
                  See how WorkSync gives your team accountability at every level. Leave your
                  details and we'll call to arrange a time.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={submit} className="mt-2 space-y-3">
                <Input placeholder="Your name *" value={form.name} onChange={field('name')} required />
                <Input
                  placeholder="Phone (WhatsApp) *"
                  value={form.phone}
                  onChange={field('phone')}
                  inputMode="tel"
                  required
                />
                <Input type="email" placeholder="Work email" value={form.email} onChange={field('email')} />
                <Input placeholder="Company" value={form.company} onChange={field('company')} />

                <select
                  value={form.team_size}
                  onChange={field('team_size')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Team size — how many people would use it?</option>
                  <option value="Under 10">Under 10</option>
                  <option value="10 to 50">10 to 50</option>
                  <option value="More than 50">More than 50</option>
                </select>

                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="date"
                    aria-label="Preferred demo date"
                    min={todayStr()}
                    value={form.preferred_date}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, preferred_date: e.target.value, preferred_time: '' }));
                      loadSlots(e.target.value);
                    }}
                  />
                  <select
                    aria-label="Preferred time"
                    value={form.preferred_time}
                    onChange={field('preferred_time')}
                    disabled={!form.preferred_date || loadingSlots}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                  >
                    <option value="">
                      {!form.preferred_date ? 'Pick a date first' : loadingSlots ? 'Loading…' : 'Preferred time'}
                    </option>
                    {slots.map((s) => (
                      <option key={s.time} value={s.time} disabled={!s.available}>
                        {fmt12(s.time)}{s.available ? '' : ' — booked'}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="-mt-1 text-xs text-muted-foreground">Preferred demo day & time (booked slots are greyed out; we'll confirm on a quick call)</p>

                <Textarea
                  placeholder="Anything we should know? (optional)"
                  value={form.message}
                  onChange={field('message')}
                  rows={3}
                />

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
                      Request demo <ArrowRight className="ml-1 h-4 w-4" />
                    </>
                  )}
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  No spam — we'll only use this to arrange your demo.
                </p>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
