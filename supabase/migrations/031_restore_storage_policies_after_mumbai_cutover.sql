-- Restore storage.objects RLS policies dropped during the 2026-05-17 Mumbai cutover.
-- The task-attachments bucket carried over but all 3 policies were missing,
-- so every authenticated upload failed with RLS errors.
-- Replays 004_storage_policies.sql with DROP IF EXISTS guards.

DROP POLICY IF EXISTS "Authenticated users can upload attachments" ON storage.objects;
CREATE POLICY "Authenticated users can upload attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'task-attachments');

DROP POLICY IF EXISTS "Authenticated users can view attachments" ON storage.objects;
CREATE POLICY "Authenticated users can view attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'task-attachments');

DROP POLICY IF EXISTS "Users can delete their own attachments" ON storage.objects;
CREATE POLICY "Users can delete their own attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'task-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);
