-- ============================================================================
-- Migration 0014: Granular Profile Notification Preferences (Prompt B6.3)
-- ============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS notification_preferences jsonb NOT NULL DEFAULT jsonb_build_object(
    'auctionClosing', true,
    'outbidAlert', true,
    'escrowDisbursement', true,
    'complianceReview', true,
    'emailEnabled', true,
    'smsEnabled', true
  );
