// Shared Razorpay helpers used by verify-razorpay-payment and razorpay-webhook.
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { CYCLE_MONTHS } from './pricing.ts';

/** Hex HMAC-SHA256 — Razorpay's signature scheme for both checkout and webhooks. */
export async function hmacHex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

interface PaymentRow {
  id: string;
  org_id: string;
  plan_target: string;
  cycle: string | null;
  status: string;
}

/**
 * Idempotently mark a payment paid and upgrade the org's plan.
 * Returns true only if THIS call performed the transition (so the verify call
 * and the webhook can both run safely; the second is a no-op).
 */
export async function finalizePayment(
  db: SupabaseClient,
  payment: PaymentRow,
  razorpayPaymentId: string,
): Promise<boolean> {
  const { data: updated } = await db.from('payments')
    .update({ status: 'paid', razorpay_payment_id: razorpayPaymentId })
    .eq('id', payment.id)
    .neq('status', 'paid')
    .select('id')
    .maybeSingle();

  if (!updated) return false; // already finalised by the other path

  const months = CYCLE_MONTHS[payment.cycle as keyof typeof CYCLE_MONTHS] ?? 1;
  const paidThrough = new Date();
  paidThrough.setMonth(paidThrough.getMonth() + months);

  await db.from('organizations')
    .update({ plan: payment.plan_target, trial_ends_at: paidThrough.toISOString() })
    .eq('id', payment.org_id);

  return true;
}
