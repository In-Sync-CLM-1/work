-- Task Detail's Delete button (perms.canDeleteTask) has allowed the task
-- creator OR an org admin since it was built, but the DB policy only ever
-- allowed the creator -- an admin clicking Delete on someone else's task
-- would see the button, get the confirm dialog, and have Postgres silently
-- filter the row out via RLS (a DELETE that matches 0 rows is not an error).
-- Match the policy to what the UI already promises.
DROP POLICY IF EXISTS "Task creators can delete tasks in their org" ON tasks;
CREATE POLICY "Task creators and org admins can delete tasks in their org"
    ON tasks FOR DELETE
    TO authenticated
    USING (
        org_id = auth_user_org_id()
        AND (assigned_by = auth.uid() OR is_org_admin())
    );
