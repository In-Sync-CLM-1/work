import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { verifySsoToken } from '../_shared/sso.ts';

// Redeems a signed handoff code from RMPL (the fleet identity provider) and
// mints a real Work-Sync session for the matching person — creating their
// account + org membership on first arrival if this is their first time here.

const REDEFINE_MARCOM_ORG_NAME = 'Redefine Marcom';

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { code } = await req.json().catch(() => ({}));
    if (!code || typeof code !== 'string') {
      return jsonResponse({ error: 'missing_code' }, 400);
    }

    const secret = Deno.env.get('SSO_SIGNING_SECRET');
    if (!secret) {
      console.error('[sso-exchange] SSO_SIGNING_SECRET not set');
      return jsonResponse({ error: 'server_misconfigured' }, 500);
    }

    const verified = await verifySsoToken(code, secret);
    if (!verified.valid) {
      return jsonResponse({ error: verified.error }, 401);
    }
    const claims = verified.payload as {
      email: string;
      full_name: string | null;
      phone: string | null;
      designation_title: string | null;
      department: string | null;
      manager_email: string | null;
      jti: string;
    };

    if (!claims.email) {
      return jsonResponse({ error: 'missing_email_claim' }, 400);
    }
    const email = claims.email.toLowerCase().trim();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Single-use: claim the jti before doing anything else. A replayed code
    // fails here on the second attempt (primary key conflict).
    const { error: replayErr } = await supabase
      .from('sso_issued_codes')
      .insert({ jti: claims.jti });
    if (replayErr) {
      return jsonResponse({ error: 'code_already_used' }, 401);
    }

    // ── Find or create the person ───────────────────────────────────────
    let userId: string;
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, org_id, full_name, phone, reports_to')
      .eq('email', email)
      .maybeSingle();

    if (existingProfile) {
      userId = existingProfile.id;
    } else {
      const nameParts = (claims.full_name ?? email.split('@')[0]).trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ');

      const { data: created, error: createErr } = await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          full_name: claims.full_name ?? email,
          first_name: firstName,
          last_name: lastName,
        },
      });
      if (createErr || !created.user) {
        console.error('[sso-exchange] createUser failed', createErr);
        return jsonResponse({ error: 'user_create_failed' }, 500);
      }
      userId = created.user.id;
    }

    // ── Find or create the Redefine Marcom org ──────────────────────────
    const { data: org, error: orgErr } = await supabase
      .from('organizations')
      .select('id')
      .eq('name', REDEFINE_MARCOM_ORG_NAME)
      .single();
    if (orgErr || !org) {
      console.error('[sso-exchange] Redefine Marcom org missing', orgErr);
      return jsonResponse({ error: 'org_missing' }, 500);
    }

    // ── Resolve manager (self-healing: park it if they haven't arrived yet) ──
    let managerId: string | null = existingProfile?.reports_to ?? null;
    if (!managerId && claims.manager_email) {
      const { data: manager } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', claims.manager_email.toLowerCase().trim())
        .maybeSingle();

      if (manager) {
        managerId = manager.id;
      } else {
        await supabase
          .from('sso_pending_reports_to')
          .upsert({ user_id: userId, manager_email: claims.manager_email.toLowerCase().trim() });
      }
    }

    // ── Update this person's profile ────────────────────────────────────
    await supabase
      .from('profiles')
      .update({
        org_id: org.id,
        full_name: existingProfile?.full_name || claims.full_name || email,
        phone: existingProfile?.phone ?? claims.phone ?? null,
        department: claims.department ?? null,
        reports_to: managerId,
        onboarding_completed: true,
        is_active: true,
      })
      .eq('id', userId);

    // Ensure org membership (role: admin only for the top of the RMPL chain
    // — nobody reports to them — everyone else lands as a safe default the
    // org admin can promote later from the Users page).
    const { data: existingRole } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', userId)
      .eq('org_id', org.id)
      .maybeSingle();

    if (!existingRole) {
      await supabase.from('user_roles').insert({
        user_id: userId,
        org_id: org.id,
        role: claims.manager_email ? 'analyst' : 'admin',
        is_active: true,
      });
    }

    // ── Resolve anyone who was waiting on THIS person to show up ────────
    const { data: pending } = await supabase
      .from('sso_pending_reports_to')
      .select('user_id')
      .eq('manager_email', email);

    if (pending && pending.length > 0) {
      const pendingIds = pending.map((p) => p.user_id);
      await supabase.from('profiles').update({ reports_to: userId }).in('id', pendingIds);
      await supabase.from('sso_pending_reports_to').delete().eq('manager_email', email);
    }

    // ── Mint a real local session ───────────────────────────────────────
    const { data: link, error: linkErr } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email,
    });
    if (linkErr || !link) {
      console.error('[sso-exchange] generateLink failed', linkErr);
      return jsonResponse({ error: 'session_mint_failed' }, 500);
    }

    return jsonResponse({
      email,
      hashed_token: link.properties.hashed_token,
    });
  } catch (err) {
    console.error('[sso-exchange] error', err);
    return jsonResponse({ error: 'internal_error' }, 500);
  }
});
