-- ============================================================================
-- Migration 0003: Indexes, Business Constraints & Reusable Updated-At Trigger
-- Ensures 0 unindexed foreign keys, BR-02 active-VIN uniqueness, and PostGIS GiST
-- ============================================================================

-- 1. BR-02: Only one active listing per VIN at any time
CREATE UNIQUE INDEX IF NOT EXISTS uniq_listings_active_vin
  ON public.listings (upper(vin))
  WHERE status IN ('PENDING_MODERATION', 'ACTIVE', 'UNSEALED', 'ACCEPTED');

-- 2. PostGIS GiST Spatial Indexes (H6)
CREATE INDEX IF NOT EXISTS idx_profiles_location_gist
  ON public.profiles USING GIST (location);

CREATE INDEX IF NOT EXISTS idx_dealerships_location_gist
  ON public.dealerships USING GIST (location);

CREATE INDEX IF NOT EXISTS idx_listings_location_gist
  ON public.listings USING GIST (location);

CREATE INDEX IF NOT EXISTS idx_postal_centroids_location_gist
  ON public.postal_centroids USING GIST (location);

-- 3. Complete Foreign Key & Query Indexes (Zero Unindexed Foreign Keys)

-- platform_config
CREATE INDEX IF NOT EXISTS idx_platform_config_updated_by
  ON public.platform_config (updated_by);

-- profiles
CREATE INDEX IF NOT EXISTS idx_profiles_dealership_id
  ON public.profiles (dealership_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role
  ON public.profiles (role);

-- user_consents
CREATE INDEX IF NOT EXISTS idx_user_consents_user_id_type
  ON public.user_consents (user_id, consent_type);

-- kyc_submissions (user_id already indexed via UNIQUE constraint)
CREATE INDEX IF NOT EXISTS idx_kyc_submissions_reviewed_by
  ON public.kyc_submissions (reviewed_by);
CREATE INDEX IF NOT EXISTS idx_kyc_submissions_status
  ON public.kyc_submissions (status);

-- dealerships
CREATE INDEX IF NOT EXISTS idx_dealerships_verified_by
  ON public.dealerships (verified_by);
CREATE INDEX IF NOT EXISTS idx_dealerships_status
  ON public.dealerships (status);

-- dealership_members (dealership_id is leading column of UNIQUE (dealership_id, user_id))
CREATE INDEX IF NOT EXISTS idx_dealership_members_user_id
  ON public.dealership_members (user_id);
CREATE INDEX IF NOT EXISTS idx_dealership_members_invited_by
  ON public.dealership_members (invited_by);

-- subscriptions (dealership_id already indexed via UNIQUE constraint)
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id
  ON public.subscriptions (plan_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status
  ON public.subscriptions (status);

-- payments
CREATE INDEX IF NOT EXISTS idx_payments_subscription_id
  ON public.payments (subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_dealership_created_at
  ON public.payments (dealership_id, created_at DESC);

-- listings
CREATE INDEX IF NOT EXISTS idx_listings_seller_created_at
  ON public.listings (seller_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_moderated_by
  ON public.listings (moderated_by);
CREATE INDEX IF NOT EXISTS idx_listings_parent_listing_id
  ON public.listings (parent_listing_id);
CREATE INDEX IF NOT EXISTS idx_listings_status_ends_at
  ON public.listings (status, auction_ends_at);
CREATE INDEX IF NOT EXISTS idx_listings_province_status
  ON public.listings (province, status);

-- listing_media
CREATE INDEX IF NOT EXISTS idx_listing_media_listing_sort
  ON public.listing_media (listing_id, sort_order);

-- damage_hotspots
CREATE INDEX IF NOT EXISTS idx_damage_hotspots_listing_id
  ON public.damage_hotspots (listing_id);

-- bids
CREATE INDEX IF NOT EXISTS idx_bids_listing_amount_desc
  ON public.bids (listing_id, amount_cents DESC);
CREATE INDEX IF NOT EXISTS idx_bids_dealership_status
  ON public.bids (dealership_id, status);
CREATE INDEX IF NOT EXISTS idx_bids_placed_by_user_id
  ON public.bids (placed_by_user_id);

-- matches (listing_id & winning_bid_id already indexed via UNIQUE constraints)
CREATE INDEX IF NOT EXISTS idx_matches_dealership_created_at
  ON public.matches (dealership_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_matches_seller_created_at
  ON public.matches (seller_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_matches_logged_by_user_id
  ON public.matches (logged_by_user_id);
CREATE INDEX IF NOT EXISTS idx_matches_outcome_expires
  ON public.matches (outcome, accept_expires_at);

-- disputes
CREATE INDEX IF NOT EXISTS idx_disputes_match_id
  ON public.disputes (match_id);
CREATE INDEX IF NOT EXISTS idx_disputes_listing_id
  ON public.disputes (listing_id);
CREATE INDEX IF NOT EXISTS idx_disputes_raised_by_user_id
  ON public.disputes (raised_by_user_id);
CREATE INDEX IF NOT EXISTS idx_disputes_assigned_admin_id
  ON public.disputes (assigned_admin_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status_created_at
  ON public.disputes (status, created_at DESC);

-- dispute_timeline
CREATE INDEX IF NOT EXISTS idx_dispute_timeline_dispute_created_at
  ON public.dispute_timeline (dispute_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_dispute_timeline_actor_user_id
  ON public.dispute_timeline (actor_user_id);

-- notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created
  ON public.notifications (user_id, read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_listing_id
  ON public.notifications (listing_id);

-- notification_deliveries
CREATE INDEX IF NOT EXISTS idx_notification_deliveries_notification_id
  ON public.notification_deliveries (notification_id);
CREATE INDEX IF NOT EXISTS idx_notification_deliveries_user_created
  ON public.notification_deliveries (user_id, created_at DESC);

-- audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id
  ON public.audit_logs (actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
  ON public.audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity
  ON public.audit_logs (entity_type, entity_id);

-- 4. Automatic updated_at Trigger Function (hardened empty search_path)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_platform_config_updated_at
  BEFORE UPDATE ON public.platform_config
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_kyc_submissions_updated_at
  BEFORE UPDATE ON public.kyc_submissions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_dealerships_updated_at
  BEFORE UPDATE ON public.dealerships
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_dealership_members_updated_at
  BEFORE UPDATE ON public.dealership_members
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_plans_updated_at
  BEFORE UPDATE ON public.plans
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_listings_updated_at
  BEFORE UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_bids_updated_at
  BEFORE UPDATE ON public.bids
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_matches_updated_at
  BEFORE UPDATE ON public.matches
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_disputes_updated_at
  BEFORE UPDATE ON public.disputes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
