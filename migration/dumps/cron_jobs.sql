select cron.schedule('weekly-summary','30 2 * * 1',$cronbody$
  SELECT net.http_post(
    url := 'https://rdhvkluvkieajtmpljyz.supabase.co/functions/v1/send-summary',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkaHZrbHV2a2llYWp0bXBsanl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5OTkxMjMsImV4cCI6MjA5NDU3NTEyM30.PWbeMA-v6SqdHEM7B70Q2BektCz4NhT4SWNd1BA00qY'
    ),
    body := '{"period":"weekly"}'::jsonb
  );
  $cronbody$);
select cron.schedule('monthly-summary','30 2 1 * *',$cronbody$
  SELECT net.http_post(
    url := 'https://rdhvkluvkieajtmpljyz.supabase.co/functions/v1/send-summary',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkaHZrbHV2a2llYWp0bXBsanl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5OTkxMjMsImV4cCI6MjA5NDU3NTEyM30.PWbeMA-v6SqdHEM7B70Q2BektCz4NhT4SWNd1BA00qY'
    ),
    body := '{"period":"monthly"}'::jsonb
  );
  $cronbody$);

