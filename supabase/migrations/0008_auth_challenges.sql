-- ============================================================================
-- Migration 0008: Auth Verification Challenges & Trigger Function Hardening
-- Supports serverless-safe FR-EU-01 two-channel (Email + SMS) OTP challenges
-- and resolves B1.3 Security Advisor warnings on auth trigger functions.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.auth_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  email_code_hash text NOT NULL,
  phone_code_hash text NOT NULL,
  email_attempts integer NOT NULL DEFAULT 0 CHECK (email_attempts >= 0),
  phone_attempts integer NOT NULL DEFAULT 0 CHECK (phone_attempts >= 0),
  email_last_sent_at timestamptz NOT NULL DEFAULT now(),
  phone_last_sent_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 minutes'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auth_challenges_expires_at
  ON public.auth_challenges (expires_at);

ALTER TABLE public.auth_challenges ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.auth_challenges FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE TRIGGER trg_auth_challenges_updated_at
  BEFORE UPDATE ON public.auth_challenges
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

REVOKE ALL ON FUNCTION public.handle_new_auth_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_profile_claims_to_auth() FROM PUBLIC, anon, authenticated;
