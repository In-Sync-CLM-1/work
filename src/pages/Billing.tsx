import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Wallet, IndianRupee, CreditCard, CheckCircle, Receipt, Crown, Phone, Clock,
  AlertTriangle, ArrowRight, Sparkles, Mail, MessageCircle, Check, Loader2,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { useOrgBilling } from '@/hooks/useOrgBilling';
import { supabase } from '@/lib/supabase';
import {
  PLANS, CYCLE_LABELS, CYCLE_MONTHS, CYCLE_DISCOUNT, calculatePlanTotal,
  calcGst, calcGrandTotal, GST_PERCENT,
  WHATSAPP_PER_MESSAGE, WHATSAPP_MIN_RECHARGE, TRIAL_DAYS, fmtINR, fmtINRDecimal,
} from '@/lib/pricing';
import type { PaidPlan, BillingCycle } from '@/lib/pricing';
import { cn } from '@/lib/utils';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, handler: (resp: { error?: { description?: string } }) => void) => void;
}

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

/** Lazily load Razorpay's checkout script — only when the user clicks Pay. */
function loadRazorpay(): Promise<void> {
  if (typeof window !== 'undefined' && window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Could not load the payment gateway. Check your connection and retry.'));
    document.body.appendChild(s);
  });
}

const METHOD_LABELS: Record<string, string> = {
  upi: 'UPI', bank_transfer: 'Bank Transfer', card: 'Card', cash: 'Cash', manual: 'Manual',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function BillingPage() {
  const { orgPlan, trialDaysLeft, isTrialExpired, orgId, user, userName, refreshAuth } = useAuth();
  const { data } = useOrgBilling(orgId);
  const qc = useQueryClient();
  const isOnTrial = orgPlan === 'trial';

  const members = data?.members ?? 1;
  const payments = data?.payments ?? [];

  const [selectedPlan, setSelectedPlan] = useState<PaidPlan>('team');
  const [cycle, setCycle] = useState<BillingCycle>('quarterly');
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [paySuccess, setPaySuccess] = useState(false);

  const activePlanDef = useMemo(
    () => PLANS.find((p) => p.id === orgPlan) ?? null,
    [orgPlan],
  );
  const selectedDef = PLANS.find((p) => p.id === selectedPlan)!;

  const projectedTotal = calculatePlanTotal(selectedPlan, Math.max(members, 1), cycle);
  const gstAmount = calcGst(projectedTotal);
  const grandTotal = calcGrandTotal(projectedTotal);

  async function handlePay() {
    setPayError(null);
    setPaySuccess(false);
    setPaying(true);
    try {
      await loadRazorpay();

      // 1. Server creates the order and recomputes the amount authoritatively.
      const { data: order, error } = await supabase.functions.invoke('create-razorpay-order', {
        body: { plan: selectedPlan, cycle },
      });
      if (error || !order?.order_id) {
        throw new Error(order?.error || error?.message || 'Could not start the payment.');
      }

      // 2. Open the Razorpay popup and wait for the outcome.
      await new Promise<void>((resolve, reject) => {
        const rzp = new window.Razorpay({
          key: order.key_id,
          amount: order.amount_in_paise,
          currency: order.currency,
          name: 'Work-Sync',
          description: `${selectedDef.name} plan · ${CYCLE_LABELS[cycle]} · ${order.seats} seat(s)`,
          order_id: order.order_id,
          prefill: { name: userName || '', email: user?.email || '' },
          notes: { plan: selectedPlan, cycle },
          theme: { color: '#7c3aed' },
          modal: { ondismiss: () => reject(new Error('Payment cancelled')) },
          handler: async (resp: RazorpayResponse) => {
            try {
              // 3. Server verifies the signature, then upgrades the plan.
              const { data: v, error: vErr } = await supabase.functions.invoke('verify-razorpay-payment', {
                body: {
                  razorpay_order_id: resp.razorpay_order_id,
                  razorpay_payment_id: resp.razorpay_payment_id,
                  razorpay_signature: resp.razorpay_signature,
                  payment_id: order.payment_id,
                },
              });
              if (vErr || !v?.ok) throw new Error(v?.error || vErr?.message || 'Payment verification failed.');
              resolve();
            } catch (err) {
              reject(err);
            }
          },
        });
        rzp.on('payment.failed', (r) => reject(new Error(r?.error?.description || 'Payment failed.')));
        rzp.open();
      });

      // 4. Refresh the session so the new plan — and the trial gate — update at once.
      await refreshAuth();
      qc.invalidateQueries({ queryKey: ['org-billing'] });
      setPaySuccess(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Something went wrong.';
      if (msg !== 'Payment cancelled') setPayError(msg);
    } finally {
      setPaying(false);
    }
  }

  // If org is on a paid plan, show "renewal" projection too
  const renewalAmount = activePlanDef
    ? calculatePlanTotal(activePlanDef.id as PaidPlan, Math.max(members, 1), activePlanDef.defaultCycle)
    : 0;

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      {/* Header */}
      <motion.div variants={fadeUp} className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
          <Wallet className="h-6 w-6 md:h-7 md:w-7 text-primary" />
          Billing &{' '}
          <span className="bg-gradient-to-r from-violet-500 to-purple-600 bg-clip-text text-transparent">
            Subscription
          </span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your plan, WhatsApp wallet, and payment history
        </p>
      </motion.div>

      {/* Trial banner */}
      {isOnTrial && (
        <motion.div variants={fadeUp} className="mb-6">
          <div className={cn(
            'rounded-2xl border p-5 md:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4',
            isTrialExpired
              ? 'border-destructive/40 bg-destructive/5'
              : trialDaysLeft <= 2
              ? 'border-orange-200 bg-orange-50/60'
              : 'border-amber-200 bg-amber-50/60'
          )}>
            <div className={cn(
              'flex h-12 w-12 items-center justify-center rounded-2xl flex-shrink-0',
              isTrialExpired ? 'bg-destructive/10' : 'bg-amber-100'
            )}>
              {isTrialExpired
                ? <AlertTriangle className="h-6 w-6 text-destructive" />
                : <Clock className="h-6 w-6 text-amber-600" />
              }
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-sm md:text-base">
                {isTrialExpired
                  ? 'Your free trial has ended'
                  : `Free trial — ${trialDaysLeft} day${trialDaysLeft === 1 ? '' : 's'} remaining`}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                {isTrialExpired
                  ? `Pick a plan below to restore access for your ${members} member${members === 1 ? '' : 's'}.`
                  : `You're on the ${TRIAL_DAYS}-day free trial. Upgrade anytime to keep access.`}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Plan picker — visible whenever on trial OR always (so users can upgrade tier) */}
      {(isOnTrial || activePlanDef) && (
        <motion.div variants={fadeUp} className="mb-6">
          {/* Cycle toggle */}
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h2 className="text-base font-bold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-fuchsia-500" />
              {isTrialExpired ? 'Choose your plan' : isOnTrial ? 'Upgrade to keep access' : 'Change your plan'}
            </h2>
            <div className="inline-flex items-center rounded-lg border bg-muted/30 p-0.5 text-xs">
              {(['monthly', 'quarterly', 'yearly'] as BillingCycle[]).map((c) => {
                const allowed = selectedDef.allowedCycles.includes(c);
                return (
                  <button
                    key={c}
                    onClick={() => allowed && setCycle(c)}
                    disabled={!allowed}
                    className={cn(
                      'px-3 py-1.5 rounded-md font-medium transition-colors',
                      cycle === c && allowed
                        ? 'bg-background shadow-sm'
                        : 'text-muted-foreground hover:text-foreground',
                      !allowed && 'opacity-40 cursor-not-allowed',
                    )}
                  >
                    {CYCLE_LABELS[c]}
                    {CYCLE_DISCOUNT[c] > 0 && (
                      <span className="ml-1 text-emerald-600 font-semibold">−{Math.round(CYCLE_DISCOUNT[c] * 100)}%</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Plan cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {PLANS.map((plan) => {
              const isSelected = selectedPlan === plan.id;
              const cycleForCard = plan.allowedCycles.includes(cycle) ? cycle : plan.defaultCycle;
              const total = calculatePlanTotal(plan.id, Math.max(members, 1), cycleForCard);
              const months = CYCLE_MONTHS[cycleForCard];
              const isCurrent = orgPlan === plan.id;

              return (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => {
                    setSelectedPlan(plan.id);
                    if (!plan.allowedCycles.includes(cycle)) setCycle(plan.defaultCycle);
                  }}
                  className={cn(
                    'relative text-left rounded-2xl border-2 p-5 md:p-6 transition-all overflow-hidden bg-card',
                    isSelected
                      ? 'border-primary shadow-lg shadow-primary/15 -translate-y-0.5'
                      : 'border-border hover:border-primary/30 hover:shadow-md',
                  )}
                >
                  {plan.highlighted && (
                    <div className="absolute -top-px right-5">
                      <span className="inline-flex items-center gap-1 rounded-b-md bg-gradient-to-r from-violet-500 to-fuchsia-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                        <Crown className="h-3 w-3" /> Popular
                      </span>
                    </div>
                  )}
                  {isCurrent && (
                    <div className="absolute top-3 right-3">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                        <Check className="h-3 w-3" /> Current
                      </span>
                    </div>
                  )}

                  <div className="flex items-start gap-3 mb-3">
                    <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center bg-gradient-to-br text-white', plan.gradient)}>
                      <Crown className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-lg">Work-Sync {plan.name}</h3>
                      <p className="text-xs text-muted-foreground">{plan.tagline}</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl md:text-4xl font-extrabold tracking-tight">
                        {fmtINR(plan.pricePerUserMonth)}
                      </span>
                      <span className="text-muted-foreground text-sm">/user/month</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Billed {CYCLE_LABELS[cycleForCard].toLowerCase()}
                      {CYCLE_DISCOUNT[cycleForCard] > 0 && (
                        <span className="text-emerald-600 font-semibold"> · save {Math.round(CYCLE_DISCOUNT[cycleForCard] * 100)}%</span>
                      )}
                    </p>
                  </div>

                  {/* Calculation strip */}
                  <div className="rounded-lg bg-muted/40 p-3 mb-4 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        {members} {members === 1 ? 'user' : 'users'} × {months} {months === 1 ? 'month' : 'months'}
                      </span>
                      <span className="font-bold text-base text-foreground">{fmtINR(total)}</span>
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="space-y-1.5">
                    {plan.features.slice(0, 6).map((f) => (
                      <li key={f} className="flex items-start gap-2 text-xs">
                        <CheckCircle className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                    {plan.features.length > 6 && (
                      <li className="text-[11px] text-muted-foreground pl-5.5">
                        +{plan.features.length - 6} more
                      </li>
                    )}
                  </ul>
                </button>
              );
            })}
          </div>

          {/* Payment instructions card */}
          <motion.div variants={fadeUp} className="mt-4 rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 via-fuchsia-50 to-pink-50 p-5 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-fuchsia-600 mb-1">
                  Your selected plan
                </p>
                <p className="text-lg font-bold">
                  Work-Sync {selectedDef.name} · {CYCLE_LABELS[cycle]}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {Math.max(members, 1)} {members === 1 ? 'seat' : 'seats'} × {fmtINR(selectedDef.pricePerUserMonth)}/user/mo × {CYCLE_MONTHS[cycle]} mo
                  {CYCLE_DISCOUNT[cycle] > 0 && ` − ${Math.round(CYCLE_DISCOUNT[cycle] * 100)}% commit discount`}
                </p>
              </div>
              <div className="text-right min-w-[190px]">
                <div className="space-y-0.5 mb-1.5">
                  <div className="flex items-center justify-between gap-6 text-xs text-muted-foreground">
                    <span>Subtotal</span>
                    <span className="font-medium text-foreground/80">{fmtINR(projectedTotal)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-6 text-xs text-muted-foreground">
                    <span>GST ({GST_PERCENT}%)</span>
                    <span className="font-medium text-foreground/80">{fmtINR(gstAmount)}</span>
                  </div>
                </div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Total payable</p>
                <p className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent leading-tight">
                  {fmtINR(grandTotal)}
                </p>
                <p className="text-[10px] text-muted-foreground">Incl. {GST_PERCENT}% GST</p>
              </div>
              <button
                type="button"
                onClick={handlePay}
                disabled={paying}
                className="flex-shrink-0 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm font-semibold shadow-lg shadow-violet-600/25 hover:shadow-violet-600/40 transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                {paying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing…
                  </>
                ) : (
                  <>
                    Pay &amp; Upgrade
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>

            {payError && (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-xs text-destructive">
                <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>{payError}</span>
              </div>
            )}
            {paySuccess && (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-xs text-emerald-700">
                <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>Payment successful — your <strong>Work-Sync {selectedDef.name}</strong> plan is now active. Full access has been restored.</span>
              </div>
            )}
            <div className="mt-4 pt-4 border-t border-violet-200/50 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <ContactRow icon={MessageCircle} label="WhatsApp" value="+91 99999 99999" color="text-emerald-600" />
              <ContactRow icon={Mail} label="Email" value="billing@in-sync.co.in" color="text-sky-600" />
              <ContactRow icon={Phone} label="Call" value="Mon–Sat, 10–7 IST" color="text-violet-600" />
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Active plan + WhatsApp wallet (only when NOT on trial) */}
      {!isOnTrial && activePlanDef && (
        <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* Current plan card */}
          <div className="relative rounded-2xl border bg-card p-6">
            <div className="absolute -top-3 right-5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-[11px] font-semibold text-primary-foreground shadow-md shadow-primary/25">
                <Crown className="h-3 w-3" /> Active Plan
              </span>
            </div>
            <h3 className="text-lg font-bold mb-1 mt-2">Work-Sync {activePlanDef.name}</h3>
            <p className="text-xs text-muted-foreground mb-4">{activePlanDef.tagline}</p>
            <div className="mb-4">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold tracking-tight">{fmtINR(activePlanDef.pricePerUserMonth)}</span>
                <span className="text-muted-foreground text-sm">/user/month</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {members} active {members === 1 ? 'seat' : 'seats'} · next renewal ~{fmtINR(renewalAmount)} ({CYCLE_LABELS[activePlanDef.defaultCycle].toLowerCase()})
              </p>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {activePlanDef.features.slice(0, 6).map((f) => (
                <div key={f} className="flex items-center gap-1.5 text-xs">
                  <CheckCircle className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                  <span className="truncate">{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* WhatsApp wallet */}
          <div className="relative overflow-hidden rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-6">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <Phone className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">WhatsApp Wallet</p>
                  <p className="text-3xl font-extrabold tracking-tight">{fmtINRDecimal(0)}</p>
                </div>
              </div>
              <div className="text-xs text-muted-foreground mb-4">
                <span className="font-semibold text-emerald-700">{fmtINRDecimal(WHATSAPP_PER_MESSAGE)}/message</span>
                {' · falls back to email when empty'}
              </div>
              <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium text-xs shadow-md shadow-emerald-600/25 hover:bg-emerald-700 transition-colors">
                <CreditCard className="h-3.5 w-3.5" />
                Recharge (min {fmtINR(WHATSAPP_MIN_RECHARGE)})
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Payment history */}
      <motion.div variants={fadeUp} className="rounded-2xl border bg-card p-5 md:p-6">
        <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
          <Receipt className="h-4 w-4" />
          Payment History
        </h3>
        {payments.length > 0 ? (
          <div className="space-y-2">
            {payments.map((p) => (
              <div key={p.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-xl bg-muted/40 px-4 py-3 gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <IndianRupee className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {PLANS.find((pl) => pl.id === p.planTarget)?.name ?? p.planTarget} plan upgrade
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {METHOD_LABELS[p.method] ?? p.method}
                      {p.referenceNo && <> · ref {p.referenceNo}</>}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 sm:gap-5 pl-12 sm:pl-0">
                  <span className="text-xs text-muted-foreground">{formatDate(p.createdAt)}</span>
                  <span className="text-sm font-bold text-emerald-700">{fmtINRDecimal(p.amount)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Receipt className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No payments yet</p>
            <p className="text-xs text-muted-foreground/70 mt-0.5">
              Payments will appear here once recorded
            </p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function ContactRow({ icon: Icon, label, value, color }: { icon: typeof Phone; label: string; value: string; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className={cn('h-4 w-4 flex-shrink-0', color)} />
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="text-xs font-medium truncate">{value}</p>
      </div>
    </div>
  );
}
