-- The task page lets an org admin close/cancel/restart/edit any task in their
-- org, but the UPDATE policy only matched the assignee or the assigner, so an
-- admin's update touched zero rows and failed with "Cannot coerce the result
-- to a single JSON object". Let org admins update tasks in their own org.

DROP POLICY IF EXISTS "Users can update tasks in their org" ON tasks;

CREATE POLICY "Users can update tasks in their org"
    ON tasks FOR UPDATE
    TO authenticated
    USING (
        (
            (assigned_to = auth.uid() OR assigned_by = auth.uid())
            AND (org_id = auth_user_org_id() OR org_id IS NULL)
        )
        OR (is_org_admin() AND org_id = auth_user_org_id())
    )
    WITH CHECK (
        org_id = auth_user_org_id() OR org_id IS NULL
    );
