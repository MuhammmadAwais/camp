-- ============================================================================
-- Migration 0017: Security Advisor Non-Destructive Hardening (Prompt B8.2)
-- Fixes (safe, zero-DROP migration):
--   1. Explicit deny policy on public.auth_challenges (`rls_enabled_no_policy`)
--   2. Revoke PUBLIC/anon/authenticated execute on public.rls_auto_enable()
-- Note: Splitting the 8 FOR ALL RLS policies and restricting
-- submit_dealer_bid/accept_dealer_bid to service_role use DROP statements
-- and are provided separately in supabase/manual/0017b_split_rls_write_policies.sql
-- for SQL Editor / `supabase db push` promotion.
-- ============================================================================

-- 1. Explicit deny policy on public.auth_challenges (server-side service_role only)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'auth_challenges'
      AND policyname = 'auth_challenges_deny_client'
  ) THEN
    CREATE POLICY auth_challenges_deny_client ON public.auth_challenges
      FOR ALL TO anon, authenticated
      USING (false)
      WITH CHECK (false);
  END IF;
END $$;

-- 2. Lock down Supabase starter helper function if present
DO $$
BEGIN
  IF to_regprocedure('public.rls_auto_enable()') IS NOT NULL THEN
    REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
  END IF;
END $$;
