// Razorpay webhook — safety net that finalises an upgrade even if the customer
// closes the browser before the success handler runs. Idempotent with the
// verify endpoint. Configure the URL + secret in the Razorpay dashboard
// (Settings → Webhooks) for events: payment.captured, order.paid.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { finalizePayment, hmacHex } from '../_shared/razorpay.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const WEBHOOK_SECRET = Deno.env.get('RAZORPAY_WEBHOOK_SECRET');
  if (!WEBHOOK_SECRET) return new Response('not configured', { status: 500 });

  // Verify the webhook signature against the RAW body.
  const raw = await req.text();
  const signature = req.headers.get('x-razorpay-signature') ?? '';
  const expected = await hmacHex(WEBHOOK_SECRET, raw);
  if (expected !== signature) return new Response('invalid signature', { status: 400 });

  try {
    const event = JSON.parse(raw);
    const type = event?.event as string | undefined;

    if (type === 'payment.captured' || type === 'order.paid') {
      const entity = event?.payload?.payment?.entity ?? {};
      const orderId = entity.order_id ?? event?.payload?.order?.entity?.id;
      const paymentId = entity.id ?? '';

      if (orderId) {
        const db = createClient(
          Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
        );
        const { data: pay } = await db.from('payments')
          .select('id, org_id, plan_target, cycle, status')
          .eq('razorpay_order_id', orderId)
          .maybeSingle();
        if (pay && pay.status !== 'paid') {
          await finalizePayment(db, pay, paymentId);
        }
      }
    }

    // Always 200 once the signature is valid, so Razorpay stops retrying.
    return new Response('ok', { status: 200 });
  } catch (_e) {
    return new Response('ok', { status: 200 });
  }
});
