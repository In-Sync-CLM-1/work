-- Starts the owner's Claude task worker at once instead of waiting for its timer.
-- Fires when the owner creates a task assigned to themselves, or when anyone comments on a task assigned to the owner
-- (an "Approved", a reply to the worker's question). The worker decides what the event means; this only wakes it.
-- The wake-up key is kept in Vault as 'claude_worker_wake_token' (set outside this file). Never blocks the insert.
create or replace function public.wake_claude_worker() returns trigger
language plpgsql security definer set search_path = public, extensions, vault as $$
declare
  owner constant uuid := 'e71b9d99-b92e-4889-946b-6f2f5955a971';  -- a@in-sync.co.in
  token text;
  relevant boolean := false;
begin
  if tg_table_name = 'tasks' then
    relevant := new.assigned_to = owner and new.assigned_by = owner;
  elsif tg_table_name = 'task_comments' then
    relevant := new.comment_type = 'comment'
      and coalesce(new.comment, '') not like '🤖 Claude worker%'
      and exists (select 1 from public.tasks t where t.id = new.task_id and t.assigned_to = owner and t.status in ('pending', 'in_progress'));
  end if;
  if relevant then
    select decrypted_secret into token from vault.decrypted_secrets where name = 'claude_worker_wake_token' limit 1;
    if token is not null then
      perform net.http_post(
        url := 'https://test-ledger.echocommunicator.workers.dev/wake',
        body := jsonb_build_object('table', tg_table_name, 'id', new.id),
        headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || token),
        timeout_milliseconds := 5000);
    end if;
  end if;
  return new;
exception when others then
  return new;  -- waking the worker must never stop a task or comment from being saved
end $$;

revoke all on function public.wake_claude_worker() from public, anon, authenticated;

drop trigger if exists wake_claude_worker on public.tasks;
create trigger wake_claude_worker after insert on public.tasks for each row execute function public.wake_claude_worker();
drop trigger if exists wake_claude_worker on public.task_comments;
create trigger wake_claude_worker after insert on public.task_comments for each row execute function public.wake_claude_worker();
