// Creates a Razorpay order for a plan upgrade and records a pending payment.
// The amount is computed entirely on the server from the plan, billing cycle,
// and the org's actual active-seat count — the client cannot influence it.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import {
  calcGst, calculatePlanTotal, GST_PERCENT, isCycleAllowed, isPaidPlan,
} from '../_shared/pricing.ts';

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const RZP_KEY_ID = Deno.env.get('RAZORPAY_KEY_ID');
    const RZP_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET');
    if (!RZP_KEY_ID || !RZP_KEY_SECRET) return json(500, { error: 'Razorpay keys not configured' });

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const db = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Identify the caller from their JWT.
    const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '');
    const { data: { user }, error: userErr } = await db.auth.getUser(token);
    if (userErr || !user) return json(401, { error: 'Not authenticated' });

    const { plan, cycle } = await req.json().catch(() => ({}));
    if (!isPaidPlan(plan)) return json(400, { error: 'Invalid plan' });
    if (!isCycleAllowed(plan, cycle)) return json(400, { error: 'Invalid billing cycle for this plan' });

    // Resolve the caller's organisation.
    const { data: profile } = await db.from('profiles').select('org_id').eq('id', user.id).single();
    const orgId = profile?.org_id;
    if (!orgId) return json(400, { error: 'No organisation for this user' });

    // Server-authoritative seat count: active, non-platform-admin roles.
    const { count } = await db.from('user_roles')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', orgId).eq('is_active', true).neq('role', 'platform_admin');
    const seats = Math.max(count ?? 1, 1);

    const base = calculatePlanTotal(plan, seats, cycle);
    const gst = calcGst(base);
    const total = Math.round((base + gst) * 100) / 100;
    const amountInPaise = Math.round(total * 100);

    // Create the order with Razorpay.
    const auth = btoa(`${RZP_KEY_ID}:${RZP_KEY_SECRET}`);
    const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `ws_${orgId.slice(0, 8)}_${Date.now()}`,
        notes: { org_id: orgId, plan, cycle, seats: String(seats) },
      }),
    });
    if (!rzpRes.ok) {
      const detail = await rzpRes.text();
      return json(502, { error: 'Razorpay order creation failed', detail });
    }
    const order = await rzpRes.json();

    // Record a pending payment row tied to this order.
    const { data: pay, error: payErr } = await db.from('payments').insert({
      org_id: orgId,
      amount: total,
      base_amount: base,
      gst_amount: gst,
      currency: 'INR',
      method: 'razorpay',
      plan_target: plan,
      cycle,
      seats,
      razorpay_order_id: order.id,
      status: 'created',
      recorded_by: user.id,
      notes: `${plan} · ${cycle} · ${seats} seat(s) · incl. ${GST_PERCENT}% GST`,
    }).select('id').single();
    if (payErr) return json(500, { error: 'Could not record payment', detail: payErr.message });

    return json(200, {
      order_id: order.id,
      amount_in_paise: amountInPaise,
      currency: 'INR',
      key_id: RZP_KEY_ID,
      payment_id: pay.id,
      base_amount: base,
      gst_amount: gst,
      total_amount: total,
      seats,
    });
  } catch (e) {
    return json(500, { error: e instanceof Error ? e.message : String(e) });
  }
});
