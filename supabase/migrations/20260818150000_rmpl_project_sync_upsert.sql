-- One-query bulk upsert for the RMPL project sync. PostgREST's upsert
-- (ON CONFLICT (org_id, source_ref) with no WHERE) can't target
-- projects_org_source_ref_idx because it's a partial index — Postgres only
-- infers a partial index when the ON CONFLICT clause repeats its predicate.
-- A SQL function can supply that predicate directly, and doing the whole
-- batch as one statement avoids hundreds of per-row round trips.
CREATE OR REPLACE FUNCTION sync_rmpl_projects(p_org_id uuid, p_rows jsonb)
RETURNS TABLE(inserted bigint, updated bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_before_count bigint;
  v_after_count bigint;
  v_touched bigint;
BEGIN
  SELECT count(*) INTO v_before_count FROM projects WHERE org_id = p_org_id AND source_ref IS NOT NULL;

  WITH incoming AS (
    SELECT
      (r->>'project_number') AS project_number,
      (r->>'project_name')   AS project_name,
      (r->>'status')         AS status,
      (r->>'source_ref')     AS source_ref,
      (r->>'updated_at')::timestamptz AS updated_at
    FROM jsonb_array_elements(p_rows) AS r
  ), upserted AS (
    INSERT INTO projects (org_id, project_number, project_name, status, source_ref, updated_at)
    SELECT p_org_id, i.project_number, i.project_name, i.status, i.source_ref, i.updated_at
    FROM incoming i
    ON CONFLICT (org_id, source_ref) WHERE source_ref IS NOT NULL
    DO UPDATE SET
      project_number = EXCLUDED.project_number,
      project_name   = EXCLUDED.project_name,
      status         = EXCLUDED.status,
      updated_at     = EXCLUDED.updated_at
    WHERE projects.project_number IS DISTINCT FROM EXCLUDED.project_number
       OR projects.project_name   IS DISTINCT FROM EXCLUDED.project_name
       OR projects.status         IS DISTINCT FROM EXCLUDED.status
    RETURNING id
  )
  SELECT count(*) INTO v_touched FROM upserted;

  SELECT count(*) INTO v_after_count FROM projects WHERE org_id = p_org_id AND source_ref IS NOT NULL;

  RETURN QUERY SELECT (v_after_count - v_before_count) AS inserted, (v_touched - (v_after_count - v_before_count)) AS updated;
END;
$$;

REVOKE ALL ON FUNCTION sync_rmpl_projects(uuid, jsonb) FROM PUBLIC;
