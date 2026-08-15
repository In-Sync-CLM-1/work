#!/usr/bin/env node
/**
 * Carry Redefine Marcom's task history from RMPL into Work-Sync.
 *
 * Idempotent: every copied row carries a source_ref holding the RMPL id, and
 * inserts are ON CONFLICT DO NOTHING. Re-running only fills gaps.
 *
 * Phases (run all, or one at a time with `node migrate-rmpl-tasks.mjs users`):
 *   users     — recreate people who left, so history keeps its names
 *   projects  — 949 projects as a reference list
 *   tasks     — the tasks themselves, then a second pass for the links
 *   files     — copy R2 objects across and attach them
 *   verify    — reconcile both databases and print the comparison
 *
 * Reads RMPL, writes Work-Sync. Never writes to RMPL.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));

function loadEnv(path) {
  const out = {};
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
    if (m) out[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
  return out;
}

const workEnv = loadEnv(join(HERE, '..', '.env'));
const rmplEnv = loadEnv(join(HERE, '..', '..', 'rmpl', '.env'));

const RMPL_REF = 'ufwvyybrctjpwipbveqe';
const WORK_REF = workEnv.SUPABASE_PROJECT_REF;
const WORK_URL = workEnv.VITE_SUPABASE_URL;
const WORK_SERVICE_KEY = workEnv.SUPABASE_SERVICE_ROLE_KEY;
const WORK_SITE = 'https://work-sync.pages.dev';
const RMPL_SITE = 'https://rmpl.in-sync.co.in';
const ORG_NAME = 'Redefine Marcom';

// RMPL's own R2 buckets, both public.
const BRIEF_BUCKET = 'task-brief-files';
const COMPLETION_BUCKET = 'task-completion-files';

async function sql(ref, token, query) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'curl/8',
    },
    body: JSON.stringify({ query }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`SQL failed (${res.status}): ${text}\n--- query ---\n${query.slice(0, 800)}`);
  return text ? JSON.parse(text) : [];
}

const fromRmpl = (q) => sql(RMPL_REF, rmplEnv.SUPABASE_ACCESS_TOKEN, q);
const toWork = (q) => sql(WORK_REF, workEnv.SUPABASE_ACCESS_TOKEN, q);

/** SQL literal. Null-safe, quote-safe. */
function lit(v) {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number') return String(v);
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  return `'${String(v).replace(/'/g, "''")}'`;
}
const jsonLit = (v) => (v === null || v === undefined ? `'[]'::jsonb` : `${lit(JSON.stringify(v))}::jsonb`);

/** Insert in batches so no single statement gets unwieldy. */
async function insertBatched(label, rows, buildStatement, size = 200) {
  let done = 0;
  for (let i = 0; i < rows.length; i += size) {
    const chunk = rows.slice(i, i + size);
    await toWork(buildStatement(chunk));
    done += chunk.length;
    process.stdout.write(`  ${label}: ${done}/${rows.length}\r`);
  }
  process.stdout.write(`  ${label}: ${done}/${rows.length}\n`);
}

async function getOrgId() {
  const [org] = await toWork(`select id from organizations where name = ${lit(ORG_NAME)};`);
  if (!org) throw new Error(`Organisation "${ORG_NAME}" not found in Work-Sync`);
  return org.id;
}

/** email (lowercased) -> Work-Sync profile id */
async function emailMap() {
  const rows = await toWork(`select id, lower(email) as email from profiles;`);
  return new Map(rows.map((r) => [r.email, r.id]));
}

/** RMPL profile id -> email */
async function rmplUserEmails() {
  const rows = await fromRmpl(`select u.id, lower(u.email) as email from auth.users u;`);
  return new Map(rows.map((r) => [r.id, r.email]));
}

// ---------------------------------------------------------------------------
// users
// ---------------------------------------------------------------------------
async function phaseUsers() {
  console.log('\n== users ==');
  const orgId = await getOrgId();

  const participants = await fromRmpl(`
    select distinct lower(u.email) as email,
           coalesce(p.full_name, split_part(u.email, '@', 1)) as full_name
      from tasks t
      join auth.users u on u.id in (t.assigned_to, t.assigned_by)
      left join profiles p on p.id = u.id;
  `);

  const existing = await emailMap();
  const missing = participants.filter((p) => !existing.has(p.email));
  console.log(`  ${participants.length} people appear on RMPL tasks; ${missing.length} missing here`);

  for (const person of missing) {
    // Created through the auth admin API so the profile trigger fires and the
    // account is well-formed. They are then deactivated: history keeps their
    // name, but nobody can sign in or be assigned new work.
    const res = await fetch(`${WORK_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        apikey: WORK_SERVICE_KEY,
        Authorization: `Bearer ${WORK_SERVICE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: person.email,
        email_confirm: true,
        password: crypto.randomUUID() + crypto.randomUUID(),
        user_metadata: { full_name: person.full_name },
      }),
    });
    if (!res.ok) throw new Error(`Could not create ${person.email}: ${await res.text()}`);
    console.log(`  + ${person.email} (${person.full_name}) — inactive`);
  }

  if (missing.length) {
    const emails = missing.map((m) => lit(m.email)).join(',');
    await toWork(`
      update profiles
         set org_id = ${lit(orgId)},
             is_active = false,
             full_name = coalesce(nullif(full_name, ''), split_part(email, '@', 1))
       where lower(email) in (${emails});
    `);
  }
  console.log('  done');
}

// ---------------------------------------------------------------------------
// projects
// ---------------------------------------------------------------------------
async function phaseProjects() {
  console.log('\n== projects ==');
  const orgId = await getOrgId();
  const projects = await fromRmpl(`
    select id, project_number, project_name, status, created_at from projects order by created_at;
  `);
  console.log(`  ${projects.length} projects in RMPL`);

  await insertBatched('copied', projects, (chunk) => `
    insert into projects (org_id, project_number, project_name, status, source_ref, created_at)
    values ${chunk
      .map((p) => `(${lit(orgId)}, ${lit(p.project_number)}, ${lit(p.project_name || 'Untitled project')}, ${lit(p.status)}, ${lit(p.id)}, ${lit(p.created_at)})`)
      .join(',')}
    on conflict (org_id, source_ref) where source_ref is not null do nothing;
  `);
}

// ---------------------------------------------------------------------------
// tasks
// ---------------------------------------------------------------------------
async function phaseTasks() {
  console.log('\n== tasks ==');
  const orgId = await getOrgId();
  const emails = await emailMap();
  const rmplEmails = await rmplUserEmails();

  const departments = new Map(
    (await toWork(`select id, key from task_departments where org_id = ${lit(orgId)};`)).map((d) => [d.key, d.id]),
  );
  const projectBySource = new Map(
    (await toWork(`select id, source_ref from projects where org_id = ${lit(orgId)} and source_ref is not null;`))
      .map((p) => [p.source_ref, p.id]),
  );

  const tasks = await fromRmpl(`
    select id, task_name, description, assigned_to, assigned_by, due_date, status, priority,
           parent_task_id, category, subcategory, project_id, recurrence, recurrence_parent_id,
           completion_notes, completed_at, restart_reason, restarted_at, restarted_by,
           created_at, updated_at
      from tasks order by created_at;
  `);
  console.log(`  ${tasks.length} tasks in RMPL`);

  const workUser = (rmplId) => {
    const email = rmplEmails.get(rmplId);
    return email ? emails.get(email) ?? null : null;
  };

  const skipped = [];
  const rows = [];
  for (const t of tasks) {
    const assignedTo = workUser(t.assigned_to);
    const assignedBy = workUser(t.assigned_by) ?? assignedTo;
    if (!assignedTo || !assignedBy) {
      skipped.push(t.id);
      continue;
    }

    // RMPL has no sign-off step. Its completed tasks are finished business, so
    // they land as closed rather than creating a backlog of 1,961 items
    // waiting for someone to sign off work from months ago.
    const migratedClosure = 'Signed off on migration from RMPL (completed before sign-off existed)';
    const isCompleted = t.status === 'completed';

    rows.push({
      ...t,
      w_assigned_to: assignedTo,
      w_assigned_by: assignedBy,
      w_status: isCompleted ? 'closed' : t.status,
      w_department: departments.get(t.category) ?? null,
      w_project: t.project_id ? projectBySource.get(t.project_id) ?? null : null,
      w_closed_at: isCompleted ? t.completed_at : null,
      w_closed_by: isCompleted ? assignedBy : null,
      w_closure_reason: isCompleted ? migratedClosure : null,
      w_restarted_by: t.restarted_by ? workUser(t.restarted_by) : null,
    });
  }

  if (skipped.length) console.log(`  ! ${skipped.length} tasks skipped (person could not be matched)`);

  await insertBatched('copied', rows, (chunk) => `
    insert into tasks (
      org_id, task_name, description, assigned_to, assigned_by, due_date, status, priority,
      department_id, subcategory, project_id, recurrence,
      completion_notes, completion_percentage, completed_at,
      closed_at, closed_by, closure_reason,
      restart_reason, restarted_at, restarted_by,
      created_at, updated_at, source_ref
    ) values ${chunk
      .map((t) => `(
      ${lit(orgId)}, ${lit(t.task_name || 'Untitled task')}, ${lit(t.description)},
      ${lit(t.w_assigned_to)}, ${lit(t.w_assigned_by)}, ${lit(t.due_date)},
      ${lit(t.w_status)}::task_status, ${lit(t.priority || 'medium')}::task_priority,
      ${lit(t.w_department)}, ${lit(t.subcategory)}, ${lit(t.w_project)}, ${lit(t.recurrence)},
      ${lit(t.completion_notes)}, ${t.w_status === 'closed' ? 100 : 0}, ${lit(t.completed_at)},
      ${lit(t.w_closed_at)}, ${lit(t.w_closed_by)}, ${lit(t.w_closure_reason)},
      ${lit(t.restart_reason)}, ${lit(t.restarted_at)}, ${lit(t.w_restarted_by)},
      ${lit(t.created_at)}, ${lit(t.updated_at)}, ${lit(t.id)}
    )`)
      .join(',')}
    on conflict (org_id, source_ref) where source_ref is not null do nothing;
  `);

  // Second pass: parent and repeat links, now that every task exists here.
  console.log('  linking subtasks and repeat chains…');
  const withParents = rows.filter((t) => t.parent_task_id);
  const withRepeat = rows.filter((t) => t.recurrence_parent_id);

  // Both links are "find the row that came from this RMPL id", so they share
  // one shape: a VALUES list of (child source, target source) joined back.
  const link = async (column, pairs) => {
    if (!pairs.length) return;
    await insertBatched(`linking ${column}`, pairs, (chunk) => `
      update tasks child
         set ${column} = target.id
        from (values ${chunk.map(([c, p]) => `(${lit(c)}, ${lit(p)})`).join(',')}) as m(child_src, target_src)
        join tasks target
          on target.source_ref = m.target_src and target.org_id = ${lit(orgId)}
       where child.source_ref = m.child_src and child.org_id = ${lit(orgId)};
    `);
  };

  await link('parent_task_id', withParents.map((t) => [t.id, t.parent_task_id]));
  await link('recurrence_parent_id', withRepeat.map((t) => [t.id, t.recurrence_parent_id]));
}

// ---------------------------------------------------------------------------
// files
// ---------------------------------------------------------------------------
// RMPL's storage gateway sanitizes each path segment on upload (spaces and
// other characters become underscores), but the database row kept the original
// filename. So the stored key often differs from the recorded path — try the
// recorded one first, then the sanitized form.
const sanitizeSegment = (s) => s.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 200);
const sanitizeKey = (key) => key.split('/').map(sanitizeSegment).filter(Boolean).join('/');

async function copyObject(rmplKey, workBucket, workPath, contentType) {
  const candidates = [...new Set([rmplKey, sanitizeKey(rmplKey)])];
  let src = null;
  for (const key of candidates) {
    const attempt = await fetch(`${RMPL_SITE}/api/storage/o/${encodeURI(key)}`);
    if (attempt.ok) {
      src = attempt;
      break;
    }
  }
  if (!src) return { ok: false, reason: 'not found in RMPL storage' };
  const bytes = await src.arrayBuffer();

  const dest = await fetch(`${WORK_SITE}/api/storage`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${WORK_SERVICE_KEY}`,
      'X-Bucket': workBucket,
      'X-Path': encodeURIComponent(workPath),
      'X-Visibility': 'private',
      'Content-Type': contentType || src.headers.get('content-type') || 'application/octet-stream',
    },
    body: Buffer.from(bytes),
  });
  if (!dest.ok) return { ok: false, reason: `dest ${dest.status}: ${await dest.text()}` };
  const { key } = await dest.json();
  return { ok: true, key, size: bytes.byteLength };
}

async function phaseFiles() {
  console.log('\n== files ==');
  const orgId = await getOrgId();

  const source = await fromRmpl(`
    select id, brief_files::text as brief_files, completion_files::text as completion_files,
           completion_file_path, completion_file_name, assigned_to
      from tasks
     where (brief_files is not null and brief_files::text not in ('null','[]'))
        or (completion_files is not null and completion_files::text not in ('null','[]'))
        or completion_file_path is not null;
  `);

  const workTasks = new Map(
    (await toWork(`select id, source_ref, assigned_to from tasks where org_id = ${lit(orgId)} and source_ref is not null;`))
      .map((t) => [t.source_ref, t]),
  );

  let briefsCopied = 0;
  let completionsCopied = 0;
  const failures = [];

  for (const row of source) {
    const target = workTasks.get(row.id);
    if (!target) continue;

    // --- brief files: stored on the task itself, same as RMPL ---
    const briefs = JSON.parse(row.brief_files || '[]');
    if (briefs.length) {
      const moved = [];
      for (const f of briefs) {
        const result = await copyObject(
          `public/${BRIEF_BUCKET}/${f.path}`,
          'task-briefs',
          `briefs/${target.id}/${f.name}`,
          f.type,
        );
        if (result.ok) {
          moved.push({ path: result.key, name: f.name, size: f.size ?? result.size, type: f.type || '' });
          briefsCopied++;
        } else {
          failures.push({ task: row.id, file: f.path, ...result });
        }
      }
      if (moved.length) {
        await toWork(`update tasks set brief_files = ${jsonLit(moved)} where id = ${lit(target.id)};`);
      }
    }

    // --- completion files: attachment rows in Work-Sync ---
    // completion_files supersedes the legacy single-file columns when both are
    // set, so the same file isn't attached twice.
    const completionJson = JSON.parse(row.completion_files || '[]');
    const completion = completionJson.length
      ? completionJson
      : row.completion_file_path
        ? [{ path: row.completion_file_path, name: row.completion_file_name || 'attachment', size: 0 }]
        : [];

    for (const f of completion) {
      const result = await copyObject(
        `public/${COMPLETION_BUCKET}/${f.path}`,
        'task-attachments',
        `tasks/${target.id}/completion/${f.name}`,
        f.type,
      );
      if (!result.ok) {
        failures.push({ task: row.id, file: f.path, ...result });
        continue;
      }
      await toWork(`
        insert into task_attachments (task_id, file_path, file_name, file_size, file_type, attachment_type, uploaded_by, org_id)
        select ${lit(target.id)}, ${lit(result.key)}, ${lit(f.name)}, ${f.size || result.size},
               ${lit(f.type || 'application/octet-stream')}, 'completion', ${lit(target.assigned_to)}, ${lit(orgId)}
         where not exists (select 1 from task_attachments where task_id = ${lit(target.id)} and file_name = ${lit(f.name)});
      `);
      completionsCopied++;
    }
  }

  console.log(`  brief files copied: ${briefsCopied}`);
  console.log(`  completion files copied: ${completionsCopied}`);
  if (failures.length) {
    console.log(`  ! ${failures.length} files could not be copied:`);
    for (const f of failures.slice(0, 20)) console.log(`    ${f.file} — ${f.reason}`);
  }
}

// ---------------------------------------------------------------------------
// verify
// ---------------------------------------------------------------------------
async function phaseVerify() {
  console.log('\n== verify ==');
  const orgId = await getOrgId();

  const [rmplTotals] = await fromRmpl(`
    select count(*) as tasks,
           count(*) filter (where status = 'completed') as completed,
           count(*) filter (where status = 'pending') as pending,
           count(*) filter (where status = 'in_progress') as in_progress,
           count(*) filter (where status = 'cancelled') as cancelled,
           count(*) filter (where parent_task_id is not null) as subtasks,
           count(*) filter (where recurrence is not null) as repeating,
           count(*) filter (where project_id is not null) as with_project
      from tasks;
  `);
  const [workTotals] = await toWork(`
    select count(*) as tasks,
           count(*) filter (where status = 'closed') as completed,
           count(*) filter (where status = 'pending') as pending,
           count(*) filter (where status = 'in_progress') as in_progress,
           count(*) filter (where status = 'cancelled') as cancelled,
           count(*) filter (where parent_task_id is not null) as subtasks,
           count(*) filter (where recurrence is not null) as repeating,
           count(*) filter (where project_id is not null) as with_project
      from tasks where org_id = ${lit(orgId)} and source_ref is not null;
  `);

  const rows = Object.keys(rmplTotals).map((k) => ({
    measure: k,
    rmpl: Number(rmplTotals[k]),
    worksync: Number(workTotals[k]),
    match: Number(rmplTotals[k]) === Number(workTotals[k]) ? 'yes' : 'NO',
  }));
  console.table(rows);

  const rmplByCategory = await fromRmpl(`select category, count(*) as n from tasks group by 1 order by 1;`);
  const workByDepartment = await toWork(`
    select d.key as category, count(*) as n
      from tasks t join task_departments d on d.id = t.department_id
     where t.org_id = ${lit(orgId)} and t.source_ref is not null
     group by 1 order by 1;
  `);
  console.log('\n  by department:');
  console.table(
    rmplByCategory.map((r) => {
      const w = workByDepartment.find((x) => x.category === r.category);
      return {
        department: r.category,
        rmpl: Number(r.n),
        worksync: Number(w?.n ?? 0),
        match: Number(r.n) === Number(w?.n ?? 0) ? 'yes' : 'NO',
      };
    }),
  );

  const perPerson = await toWork(`
    select count(*) as people from (
      select assigned_to from tasks where org_id = ${lit(orgId)} and source_ref is not null group by 1
    ) s;
  `);
  console.log(`\n  people carrying tasks in Work-Sync: ${perPerson[0].people}`);

  const [files] = await toWork(`
    select (select count(*) from task_attachments where org_id = ${lit(orgId)}) as attachments,
           (select count(*) from tasks where org_id = ${lit(orgId)} and brief_files::text not in ('[]','null')) as tasks_with_brief;
  `);
  console.log(`  attachments: ${files.attachments}, tasks with a brief: ${files.tasks_with_brief}`);
}

// ---------------------------------------------------------------------------
const PHASES = { users: phaseUsers, projects: phaseProjects, tasks: phaseTasks, files: phaseFiles, verify: phaseVerify };

const requested = process.argv.slice(2);
const toRun = requested.length ? requested : Object.keys(PHASES);
for (const name of toRun) {
  if (!PHASES[name]) throw new Error(`Unknown phase "${name}". One of: ${Object.keys(PHASES).join(', ')}`);
}
for (const name of toRun) await PHASES[name]();
console.log('\ndone');
