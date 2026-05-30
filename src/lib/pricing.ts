/**
 * Single source of truth for Work-Sync plan pricing.
 * Mirrors what's advertised on the landing page (/Landing.tsx).
 * Update here and the org Billing page + platform admin payment flow follow.
 */

export type PaidPlan = 'team' | 'business';
export type BillingCycle = 'monthly' | 'quarterly' | 'yearly';

export interface PlanDef {
  id: PaidPlan;
  name: string;
  tagline: string;
  pricePerUserMonth: number;
  defaultCycle: BillingCycle;
  allowedCycles: BillingCycle[];
  features: string[];
  highlighted: boolean;
  gradient: string;
}

export const PLANS: PlanDef[] = [
  {
    id: 'team',
    name: 'Team',
    tagline: 'For teams that need task accountability',
    pricePerUserMonth: 199,
    defaultCycle: 'quarterly',
    allowedCycles: ['quarterly', 'yearly'],
    features: [
      'Unlimited users & tasks',
      'WhatsApp + email notifications',
      'Designation hierarchy',
      'Satisfaction confirmation',
      'AI insights & analytics',
      'Team workload dashboard',
      'Role-based access control',
      'Comments & attachments',
    ],
    highlighted: true,
    gradient: 'from-violet-500 to-purple-600',
  },
  {
    id: 'business',
    name: 'Business',
    tagline: 'For organizations needing full control',
    pricePerUserMonth: 299,
    defaultCycle: 'monthly',
    allowedCycles: ['monthly', 'quarterly', 'yearly'],
    features: [
      'Everything in Team',
      'API access',
      'Custom roles & permissions',
      'Advanced reporting & exports',
      'Dedicated account manager',
      'Custom integrations',
      'SLA guarantee',
      'Priority support',
    ],
    highlighted: false,
    gradient: 'from-emerald-500 to-green-600',
  },
];

export const PLAN_BY_ID: Record<PaidPlan, PlanDef> = {
  team: PLANS[0],
  business: PLANS[1],
};

export const CYCLE_MONTHS: Record<BillingCycle, number> = {
  monthly: 1,
  quarterly: 3,
  yearly: 12,
};

export const CYCLE_LABELS: Record<BillingCycle, string> = {
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  yearly: 'Yearly',
};

/** Discount applied to the headline rate when the customer commits longer. */
export const CYCLE_DISCOUNT: Record<BillingCycle, number> = {
  monthly: 0,
  quarterly: 0,
  yearly: 0.10, // 10% off when billed yearly
};

/**
 * Calculate the total amount for a plan invoice.
 * @param plan plan id
 * @param users number of paid seats
 * @param cycle billing cycle
 */
export function calculatePlanTotal(plan: PaidPlan, users: number, cycle: BillingCycle): number {
  if (users <= 0) return 0;
  const def = PLAN_BY_ID[plan];
  const months = CYCLE_MONTHS[cycle];
  const discount = CYCLE_DISCOUNT[cycle] ?? 0;
  const gross = def.pricePerUserMonth * users * months;
  return Math.round(gross * (1 - discount));
}

/** GST applied on top of the subscription subtotal at checkout. */
export const GST_PERCENT = 18;

/** GST amount for a subtotal, rounded to 2 decimal places. */
export function calcGst(base: number): number {
  return Math.round(base * GST_PERCENT) / 100;
}

/** Grand total payable (subtotal + GST). */
export function calcGrandTotal(base: number): number {
  return Math.round((base + calcGst(base)) * 100) / 100;
}

export const WHATSAPP_PER_MESSAGE = 0.2;
export const WHATSAPP_MIN_RECHARGE = 500;
export const TRIAL_DAYS = 14;

export function fmtINR(amount: number) {
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}

export function fmtINRDecimal(amount: number) {
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
