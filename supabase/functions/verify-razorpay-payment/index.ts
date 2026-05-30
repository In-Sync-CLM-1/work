// Verifies a completed Razorpay checkout, then upgrades the org's plan.
// Called from the browser's Razorpay success handler. The signature check is
// what makes this trustworthy — a forged success cannot pass it.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { finalizePayment, hmacHex } from '../_shared/razorpay.ts';

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const RZP_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET');
    if (!RZP_KEY_SECRET) return json(500, { error: 'Razorpay keys not configured' });

    const {
      razorpay_order_id, razorpay_payment_id, razorpay_signature, payment_id,
    } = await req.json().catch(() => ({}));

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !payment_id) {
      return json(400, { error: 'Missing payment fields' });
    }

    // Razorpay signs `${order_id}|${payment_id}` with the key secret.
    const expected = await hmacHex(RZP_KEY_SECRET, `${razorpay_order_id}|${razorpay_payment_id}`);
    if (expected !== razorpay_signature) return json(400, { error: 'Invalid payment signature' });

    const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const { data: pay } = await db.from('payments')
      .select('id, org_id, plan_target, cycle, status')
      .eq('id', payment_id)
      .eq('razorpay_order_id', razorpay_order_id)
      .single();
    if (!pay) return json(404, { error: 'Payment not found' });

    if (pay.status === 'paid') {
      return json(200, { ok: true, already: true, plan: pay.plan_target });
    }

    await finalizePayment(db, pay, razorpay_payment_id);
    return json(200, { ok: true, plan: pay.plan_target });
  } catch (e) {
    return json(500, { error: e instanceof Error ? e.message : String(e) });
  }
});
