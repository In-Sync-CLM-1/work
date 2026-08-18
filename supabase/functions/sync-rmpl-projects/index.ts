import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// Keeps Redefine Marcom's project list in step with RMPL. The one-time
// migration (rmpl_task_model) only carried a snapshot — RMPL creates new
// projects continuously, so without this the picker in TaskDialog silently
// drifts stale. Runs on a schedule via cron-worker; upserts on
// (org_id, source_ref), the same key the original import used, so re-runs
// never duplicate a row.

interface RmplProject {
  id: string;
  project_number: string | null;
  project_name: string;
  status: string | null;
  created_at: string;
  updated_at: string;
}

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
      return new Response(JSON.stringify({ error: 'RMPL_PUBLIC_API_URL / RMPL_API_KEY not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Redefine Marcom is the only org with a projects list carried from RMPL.
    const { data: org, error: orgErr } = await adminClient
      .from('organizations')
      .select('id')
      .eq('name', 'Redefine Marcom')
      .single();

    if (orgErr || !org) {
      return new Response(JSON.stringify({ error: 'Redefine Marcom organisation not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const rmplRes = await fetch(rmplApiUrl, {
      method: 'POST',
      headers: { Authorization: `Bearer ${rmplApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'list_projects' }),
    });

    if (!rmplRes.ok) {
      const text = await rmplRes.text().catch(() => '');
      return new Response(JSON.stringify({ error: `RMPL fetch failed: ${rmplRes.status} ${text}` }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const rmplJson = await rmplRes.json();
    const rmplProjects: RmplProject[] = rmplJson.data ?? [];

    const rows = rmplProjects.map((p) => ({
      project_number: p.project_number,
      project_name: p.project_name,
      status: p.status,
      source_ref: p.id,
      updated_at: p.updated_at,
    }));

    // A single bulk upsert (see sync_rmpl_projects) — projects_org_source_ref_idx
    // is a partial index, which PostgREST's upsert onConflict can't target, and
    // 950+ individual round trips risks the edge function's 150s idle timeout.
    const { data: result, error: syncErr } = await adminClient
      .rpc('sync_rmpl_projects', { p_org_id: org.id, p_rows: rows })
      .single();

    if (syncErr) {
      return new Response(JSON.stringify({ error: syncErr.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, ...result }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('sync-rmpl-projects error:', err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
