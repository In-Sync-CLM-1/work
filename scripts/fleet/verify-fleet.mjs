// Fleet conformance check against docs/multi-tenant-architecture.md.
// Behavioural, not static: static policy reading gave false results in both
// directions during the original sweep.
import { project } from './lib-fleet.mjs';

const APPS = [
  { name: 'work',               pointer: ['profiles', 'org_id'],    data: 'tasks',                 tenants: 'organizations' },
  { name: 'globalcrm',          pointer: ['profiles', 'org_id'],    data: 'contacts',              tenants: 'organizations' },
  { name: 'vendorverification', pointer: ['profiles', 'tenant_id'], data: 'vendors',               tenants: 'tenants' },
  { name: 'expense',            pointer: ['profiles', 'active_org_id'], data: 'travel_expense_claims', tenants: 'organizations' },
  { name: 'crm',                pointer: ['profiles', 'org_id'],    data: 'contacts',              tenants: 'organizations' },
];

const tenantCol = (app) => (app.name === 'vendorverification' ? 'tenant_id' : 'org_id');
const userCol = (app) => (app.name === 'vendorverification' ? 'user_id' : 'id');

for (const app of APPS) {
  let p;
  try { p = project(app.name); } catch { console.log(`${app.name.padEnd(20)} unreachable`); continue; }
  const [tbl, col] = app.pointer;

  const q = `
BEGIN;
CREATE TEMP TABLE r(k text, v text);
GRANT ALL ON r TO authenticated;
DO $do$
DECLARE v_uid uuid; v_other uuid; v_n int; v_has boolean;
BEGIN
  -- 1. does set_active_org exist
  SELECT EXISTS (SELECT 1 FROM pg_proc pr JOIN pg_namespace n ON n.oid=pr.pronamespace
                  WHERE n.nspname='public' AND pr.proname='set_active_org') INTO v_has;
  INSERT INTO r VALUES ('set_active_org', CASE WHEN v_has THEN 'present' ELSE 'MISSING' END);

  -- 2. is the pointer column writable by an ordinary user
  SELECT count(*) INTO v_n FROM information_schema.role_table_grants
   WHERE table_schema='public' AND table_name='${tbl}' AND grantee='authenticated' AND privilege_type='UPDATE';
  IF v_n > 0 THEN
    INSERT INTO r VALUES ('pointer locked', 'NO - table-wide UPDATE grant');
  ELSE
    SELECT count(*) INTO v_n FROM information_schema.column_privileges
     WHERE table_schema='public' AND table_name='${tbl}' AND column_name='${col}'
       AND grantee='authenticated' AND privilege_type='UPDATE';
    INSERT INTO r VALUES ('pointer locked', CASE WHEN v_n > 0 THEN 'NO - column granted' ELSE 'yes' END);
  END IF;

  -- 3. behavioural: ordinary user tries to cross into another tenant
  SELECT ${userCol(app)} INTO v_uid FROM ${tbl}
   WHERE ${userCol(app)} IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = ${tbl}.${userCol(app)} AND ur.role::text='platform_admin')
   LIMIT 1;
  SELECT id INTO v_other FROM ${app.tenants} LIMIT 1;
  IF v_uid IS NULL OR v_other IS NULL THEN
    INSERT INTO r VALUES ('cross-tenant write', 'no ordinary user to test');
  ELSE
    PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid, 'role','authenticated')::text, true);
    EXECUTE 'SET LOCAL ROLE authenticated';
    BEGIN
      EXECUTE format('UPDATE ${tbl} SET ${col} = %L WHERE ${userCol(app)} = %L', v_other, v_uid);
      GET DIAGNOSTICS v_n = ROW_COUNT;
      INSERT INTO r VALUES ('cross-tenant write', CASE WHEN v_n > 0 THEN '*** ' || v_n || ' ROWS CHANGED ***' ELSE 'no rows changed' END);
    EXCEPTION WHEN insufficient_privilege THEN
      INSERT INTO r VALUES ('cross-tenant write', 'blocked');
    WHEN others THEN
      INSERT INTO r VALUES ('cross-tenant write', 'blocked (' || left(SQLERRM,28) || ')');
    END;
    RESET ROLE;
  END IF;
END $do$;
RESET ROLE;
SELECT k, v FROM r;
ROLLBACK;`;

  try {
    const rows = await p.sql(q);
    const get = (k) => rows.find((x) => x.k === k)?.v ?? '?';
    const ok = get('set_active_org') === 'present' && get('pointer locked') === 'yes'
      && !get('cross-tenant write').includes('***');
    console.log(`${app.name.padEnd(20)} ${ok ? 'CONFORMS' : 'REVIEW  '}  set_active_org=${get('set_active_org')}  pointer_locked=${get('pointer locked')}  attack=${get('cross-tenant write')}`);
  } catch (e) {
    console.log(`${app.name.padEnd(20)} error: ${e.message.slice(0, 90)}`);
  }
}
