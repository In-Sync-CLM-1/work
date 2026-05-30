// Server-authoritative pricing for Razorpay checkout.
// Keep in sync with src/lib/pricing.ts — the browser only displays these
// numbers; the edge functions recompute the charge from scratch so a tampered
// client can never change what is actually billed.

export type PaidPlan = 'team' | 'business';
export type BillingCycle = 'monthly' | 'quarterly' | 'yearly';

export const PAID_PLANS: PaidPlan[] = ['team', 'business'];

const PRICE_PER_USER_MONTH: Record<PaidPlan, number> = {
  team: 199,
  business: 299,
};

const ALLOWED_CYCLES: Record<PaidPlan, BillingCycle[]> = {
  team: ['quarterly', 'yearly'],
  business: ['monthly', 'quarterly', 'yearly'],
};

export const CYCLE_MONTHS: Record<BillingCycle, number> = {
  monthly: 1,
  quarterly: 3,
  yearly: 12,
};

const CYCLE_DISCOUNT: Record<BillingCycle, number> = {
  monthly: 0,
  quarterly: 0,
  yearly: 0.1, // 10% off when billed yearly
};

export const GST_PERCENT = 18;

export function isPaidPlan(plan: unknown): plan is PaidPlan {
  return plan === 'team' || plan === 'business';
}

export function isCycleAllowed(plan: PaidPlan, cycle: unknown): cycle is BillingCycle {
  return ALLOWED_CYCLES[plan]?.includes(cycle as BillingCycle) ?? false;
}

/** Subscription subtotal (before GST), in whole rupees. */
export function calculatePlanTotal(plan: PaidPlan, users: number, cycle: BillingCycle): number {
  if (users <= 0) return 0;
  const months = CYCLE_MONTHS[cycle];
  const discount = CYCLE_DISCOUNT[cycle] ?? 0;
  const gross = PRICE_PER_USER_MONTH[plan] * users * months;
  return Math.round(gross * (1 - discount));
}

/** GST on a subtotal, rounded to 2 decimal places. */
export function calcGst(base: number): number {
  return Math.round(base * GST_PERCENT) / 100;
}
