import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// Keeps the Redefine Marcom org in step with RMPL, the fleet's identity
// source. RMPL calls this the moment a person is added, edited or exited
// (database trigger on RMPL profiles); cron-worker also runs it every 15 min
// as a safety net. Each run is a full reconcile:
//   1. Active RMPL employees missing here get an account + org role.
//   2. Everyone's manager (reports_to) and department follow RMPL.
//   3. People RMPL has exited lose access: profile and org role go inactive
//      and the login is blocked. If RMPL makes them active again, the block
//      this sync put on is lifted.

interface RmplEmployee {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  reports_to: string | null;
  department: string | null;
}

interface WorkProfile {
  id: string;
  email: string;
  reports_to: string | null;
  department: string | null;
  is_active: boolean | null;
}

const EXIT_BAN = '876000h'; // ~100 years

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function randomPassword(): string {
  return crypto.randomUUID() + crypto.randomUUID();
}

const RMPL_EMAIL_DOMAINS = ['redefine.in', 'redefinemarcom.in', 'asrmedia.in'];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const rmplApiUrl = Deno.env.get('RMPL_PUBLIC_API_URL');
    const rmplApiKey = Deno.env.get('RMPL_API_KEY');

    if (!rmplApiUrl || !rmplApiKey) {
      return json({ error: 'RMPL_PUBLIC_API_URL / RMPL_API_KEY not configured' }, 500);
    }

    const admin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: org, error: orgErr } = await admin
      .from('organizations')
      .select('id')
      .eq('name', 'Redefine Marcom')
      .single();
    if (orgErr || !org) {
      return json({ error: 'Redefine Marcom organisation not found' }, 404);
    }

    const rmplRes = await fetch(rmplApiUrl, {
      method: 'POST',
      headers: { Authorization: `Bearer ${rmplApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'list_employees' }),
    });
    if (!rmplRes.ok) {
      const text = await rmplRes.text().catch(() => '');
      return json({ error: `RMPL fetch failed: ${rmplRes.status} ${text}` }, 502);
    }
    const rmplJson = await rmplRes.json();
    const employees: RmplEmployee[] = (rmplJson.data ?? []).filter((e: RmplEmployee) => !!e.email);
    // Older RMPL builds don't send `exited`; then nobody is closed this run.
    const exitedEmails: string[] = Array.isArray(rmplJson.exited) ? rmplJson.exited : [];
    const byRmplId = new Map(employees.map((e) => [e.id, e]));

    const domainOr = RMPL_EMAIL_DOMAINS.map((d) => `email.ilike.%@${d}`).join(',');
    const { data: existingProfiles, error: profErr } = await admin
      .from('profiles')
      .select('id, email, reports_to, department, is_active')
      .or(domainOr);
    if (profErr) throw profErr;
    const profileByEmail = new Map(
      ((existingProfiles ?? []) as WorkProfile[]).map((p) => [p.email.toLowerCase(), p]),
    );
    const workIdByEmail = new Map([...profileByEmail.entries()].map(([e, p]) => [e, p.id]));

    const { data: roleRows, error: roleErr } = await admin
      .from('user_roles')
      .select('user_id, is_active')
      .eq('org_id', org.id);
    if (roleErr) throw roleErr;
    const roleActiveByUser = new Map((roleRows ?? []).map((r) => [r.user_id as string, !!r.is_active]));

    const created: string[] = [];
    const managersUpdated: string[] = [];
    const deactivated: string[] = [];
    const reactivated: string[] = [];
    const errors: { email: string; error: string }[] = [];

    // ── 1. Create missing active employees ─────────────────────────────
    for (const emp of employees) {
      const email = emp.email.toLowerCase();
      if (workIdByEmail.has(email)) continue;

      const { data: userData, error: createErr } = await admin.auth.admin.createUser({
        email: emp.email,
        password: randomPassword(),
        email_confirm: true,
        user_metadata: { full_name: emp.full_name ?? '' },
      });
      let userId = userData?.user?.id;
      if (createErr || !userId) {
        if (createErr?.message?.toLowerCase().includes('already been registered')) {
          const lookup = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
          userId = lookup.data?.users?.find((u) => u.email?.toLowerCase() === email)?.id;
        }
        if (!userId) {
          errors.push({ email: emp.email, error: createErr?.message ?? 'createUser failed' });
          continue;
        }
      }

      const { error: profileErr } = await admin
        .from('profiles')
        .upsert(
          {
            id: userId,
            email: emp.email,
            full_name: emp.full_name ?? emp.email,
            phone: emp.phone ?? null,
            is_active: true,
            onboarding_completed: true,
          },
          { onConflict: 'id' },
        );
      if (profileErr) {
        errors.push({ email: emp.email, error: profileErr.message });
        if (!createErr) await admin.auth.admin.deleteUser(userId);
        continue;
      }
      // Never override an existing active org (e.g. a platform admin).
      await admin.from('profiles').update({ org_id: org.id }).eq('id', userId).is('org_id', null);

      workIdByEmail.set(email, userId);
      profileByEmail.set(email, { id: userId, email: emp.email, reports_to: null, department: null, is_active: true });
      created.push(emp.email);
    }

    // ── 2. Every active employee: org role, manager, department ───────
    for (const emp of employees) {
      const email = emp.email.toLowerCase();
      const profile = profileByEmail.get(email);
      if (!profile) continue;

      const roleActive = roleActiveByUser.get(profile.id);
      if (!roleActive) {
        // New member gets the default role; a returning one keeps theirs.
        const { error: rErr } = roleActive === undefined
          ? await admin.from('user_roles').upsert(
              { org_id: org.id, user_id: profile.id, role: 'analyst', is_active: true },
              { onConflict: 'user_id,org_id' },
            )
          : await admin.from('user_roles').update({ is_active: true }).eq('org_id', org.id).eq('user_id', profile.id);
        if (rErr) { errors.push({ email: emp.email, error: rErr.message }); continue; }
        roleActiveByUser.set(profile.id, true);
      }

      if (profile.is_active === false) {
        await admin.from('profiles').update({ is_active: true }).eq('id', profile.id);
        const { data: au } = await admin.auth.admin.getUserById(profile.id);
        if (au?.user?.app_metadata?.rmpl_exit_block) {
          await admin.auth.admin.updateUserById(profile.id, {
            ban_duration: 'none',
            app_metadata: { ...au.user.app_metadata, rmpl_exit_block: false },
          });
        }
        reactivated.push(emp.email);
      }

      // Manager follows RMPL; no manager in RMPL leaves the current one.
      const manager = emp.reports_to ? byRmplId.get(emp.reports_to) : null;
      const managerWorkId = manager ? workIdByEmail.get(manager.email.toLowerCase()) ?? null : null;
      const patch: Record<string, unknown> = {};
      if (managerWorkId && managerWorkId !== profile.id && profile.reports_to !== managerWorkId) {
        patch.reports_to = managerWorkId;
      }
      if (emp.department && emp.department !== profile.department) patch.department = emp.department;
      if (Object.keys(patch).length) {
        const { error: uErr } = await admin.from('profiles').update(patch).eq('id', profile.id);
        if (uErr) errors.push({ email: emp.email, error: uErr.message });
        else if (patch.reports_to) managersUpdated.push(emp.email);
      }
    }

    // ── 3. Exited in RMPL → no access here ─────────────────────────────
    for (const raw of exitedEmails) {
      const email = raw.toLowerCase();
      const profile = profileByEmail.get(email);
      if (!profile) continue;
      if (profile.is_active === false && !roleActiveByUser.get(profile.id)) continue;

      const { error: e1 } = await admin
        .from('user_roles')
        .update({ is_active: false })
        .eq('org_id', org.id)
        .eq('user_id', profile.id);
      if (e1) { errors.push({ email, error: e1.message }); continue; }
      const { error: e2 } = await admin.from('profiles').update({ is_active: false }).eq('id', profile.id);
      if (e2) { errors.push({ email, error: e2.message }); continue; }

      const { data: au } = await admin.auth.admin.getUserById(profile.id);
      if (au?.user) {
        const { error: e3 } = await admin.auth.admin.updateUserById(profile.id, {
          ban_duration: EXIT_BAN,
          app_metadata: { ...au.user.app_metadata, rmpl_exit_block: true },
        });
        if (e3) { errors.push({ email, error: e3.message }); continue; }
      }
      deactivated.push(email);
    }

    return json({
      success: errors.length === 0,
      checked: employees.length,
      created,
      managersUpdated,
      deactivated,
      reactivated,
      errors,
    });
  } catch (error) {
    console.error('sync-rmpl-employees failed:', error);
    return json({ error: error instanceof Error ? error.message : 'Sync failed' }, 500);
  }
});
