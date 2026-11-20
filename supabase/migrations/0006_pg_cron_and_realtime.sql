-- ============================================================================
-- Migration 0006: pg_cron 1-Minute Sweeps & Supabase Realtime Publication
-- Satisfies H3 (durable timers) and H5 (realtime bid count & notifications)
-- ============================================================================

-- 1. Schedule 1-minute idempotent reconciliation sweeps inside Postgres
DO $$
DECLARE
  v_job_id bigint;
BEGIN
  FOR v_job_id IN
    SELECT jobid FROM cron.job WHERE jobname IN ('close-expired-auctions', 'expire-overdue-matches')
  LOOP
    PERFORM cron.unschedule(v_job_id);
  END LOOP;
END $$;

SELECT cron.schedule(
  'close-expired-auctions',
  '* * * * *',
  $$SELECT private.close_expired_auctions();$$
);

SELECT cron.schedule(
  'expire-overdue-matches',
  '* * * * *',
  $$SELECT private.expire_overdue_matches();$$
);

-- 2. Enable Supabase Realtime CDC on listings (bid_count/status) & notifications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'listings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.listings;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;
