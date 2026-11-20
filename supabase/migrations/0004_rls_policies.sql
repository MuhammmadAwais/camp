-- ============================================================================
-- Migration 0004: Row-Level Security Policies, Private Helpers & Views
-- Enforces Sealed-Bid Secrecy (H1 / BR-04) & Append-Only Audit Logs (NFR-11)
-- ============================================================================

-- 1. Non-exposed private schema for SECURITY DEFINER RLS helpers
CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated, service_role, postgres;

-- 2. Private Security-Definer RLS Helper Functions (break cross-table recursion)
CREATE OR REPLACE FUNCTION private.current_user_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT role
  FROM public.profiles
  WHERE id = (SELECT auth.uid())
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION private.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = (SELECT auth.uid())
      AND role = 'ADMIN'
      AND account_status = 'ACTIVE'
  );
$$;

CREATE OR REPLACE FUNCTION private.current_dealership_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT dealership_id
  FROM public.profiles
  WHERE id = (SELECT auth.uid())
    AND account_status = 'ACTIVE'
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION private.is_verified_dealer()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.dealerships d ON d.id = p.dealership_id
    WHERE p.id = (SELECT auth.uid())
      AND p.role IN ('DEALER_ADMIN', 'DEALER_AGENT')
      AND p.account_status = 'ACTIVE'
      AND d.status = 'VERIFIED'
  );
$$;

CREATE OR REPLACE FUNCTION private.is_dealer_admin_of(p_dealership_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.dealership_members dm
    WHERE dm.dealership_id = p_dealership_id
      AND dm.user_id = (SELECT auth.uid())
      AND dm.seat_role = 'DEALER_ADMIN'
      AND dm.is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION private.dealer_has_bid_on_listing(p_listing_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.bids b
    JOIN public.profiles p ON p.id = (SELECT auth.uid())
    WHERE b.listing_id = p_listing_id
      AND b.dealership_id = p.dealership_id
      AND p.account_status = 'ACTIVE'
  );
$$;

CREATE OR REPLACE FUNCTION private.is_unsealed_seller_listing(p_listing_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.listings l
    WHERE l.id = p_listing_id
      AND l.seller_id = (SELECT auth.uid())
      AND l.status IN ('UNSEALED', 'ACCEPTED', 'COMPLETED', 'EXPIRED')
  );
$$;

CREATE OR REPLACE FUNCTION private.is_listing_editable_by_owner(p_listing_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.listings l
    WHERE l.id = p_listing_id
      AND l.seller_id = (SELECT auth.uid())
      AND l.status IN ('DRAFT', 'PENDING_MODERATION', 'EDITS_REQUESTED')
  );
$$;

CREATE OR REPLACE FUNCTION private.is_match_participant(p_match_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.matches m
    LEFT JOIN public.profiles p ON p.id = (SELECT auth.uid())
    WHERE m.id = p_match_id
      AND (
        m.seller_id = (SELECT auth.uid())
        OR (m.dealership_id = p.dealership_id AND p.account_status = 'ACTIVE')
      )
  );
$$;

REVOKE ALL ON FUNCTION private.current_user_role() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.is_admin() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.current_dealership_id() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.is_verified_dealer() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.is_dealer_admin_of(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.dealer_has_bid_on_listing(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.is_unsealed_seller_listing(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.is_listing_editable_by_owner(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.is_match_participant(uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION private.current_user_role() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_admin() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.current_dealership_id() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_verified_dealer() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_dealer_admin_of(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.dealer_has_bid_on_listing(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_unsealed_seller_listing(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_listing_editable_by_owner(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_match_participant(uuid) TO authenticated, service_role;

-- 3. Immutable Audit Trail Protection (NFR-11, H8)
REVOKE UPDATE, DELETE, TRUNCATE ON public.audit_logs FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.prevent_audit_log_mutation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  RAISE EXCEPTION 'AUDIT_LOGS_IMMUTABLE: Audit records cannot be modified or deleted';
END;
$$;

CREATE OR REPLACE TRIGGER trg_audit_logs_immutable
  BEFORE UPDATE OR DELETE ON public.audit_logs
  FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_log_mutation();

-- 4. Guarded RLS Policies Across All 22 Public Tables

-- platform_config
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'platform_config' AND policyname = 'platform_config_select') THEN
    CREATE POLICY platform_config_select ON public.platform_config
      FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'platform_config' AND policyname = 'platform_config_admin_write') THEN
    CREATE POLICY platform_config_admin_write ON public.platform_config
      FOR ALL TO authenticated
      USING ((SELECT private.is_admin()))
      WITH CHECK ((SELECT private.is_admin()));
  END IF;
END $$;

-- plans
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'plans' AND policyname = 'plans_select') THEN
    CREATE POLICY plans_select ON public.plans
      FOR SELECT TO anon, authenticated
      USING (is_active = true OR (SELECT private.is_admin()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'plans' AND policyname = 'plans_admin_write') THEN
    CREATE POLICY plans_admin_write ON public.plans
      FOR ALL TO authenticated
      USING ((SELECT private.is_admin()))
      WITH CHECK ((SELECT private.is_admin()));
  END IF;
END $$;

-- postal_centroids & vin_decode_cache
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'postal_centroids' AND policyname = 'postal_centroids_select') THEN
    CREATE POLICY postal_centroids_select ON public.postal_centroids
      FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'postal_centroids' AND policyname = 'postal_centroids_admin_write') THEN
    CREATE POLICY postal_centroids_admin_write ON public.postal_centroids
      FOR ALL TO authenticated
      USING ((SELECT private.is_admin()))
      WITH CHECK ((SELECT private.is_admin()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'vin_decode_cache' AND policyname = 'vin_decode_cache_select') THEN
    CREATE POLICY vin_decode_cache_select ON public.vin_decode_cache
      FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'vin_decode_cache' AND policyname = 'vin_decode_cache_admin_write') THEN
    CREATE POLICY vin_decode_cache_admin_write ON public.vin_decode_cache
      FOR ALL TO authenticated
      USING ((SELECT private.is_admin()))
      WITH CHECK ((SELECT private.is_admin()));
  END IF;
END $$;

-- stripe_webhook_events & notification_deliveries (admin read only; service role writes)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'stripe_webhook_events' AND policyname = 'stripe_webhook_events_admin_select') THEN
    CREATE POLICY stripe_webhook_events_admin_select ON public.stripe_webhook_events
      FOR SELECT TO authenticated USING ((SELECT private.is_admin()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'notification_deliveries' AND policyname = 'notification_deliveries_admin_select') THEN
    CREATE POLICY notification_deliveries_admin_select ON public.notification_deliveries
      FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()) OR (SELECT private.is_admin()));
  END IF;
END $$;

-- profiles
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'profiles_select') THEN
    CREATE POLICY profiles_select ON public.profiles
      FOR SELECT TO authenticated
      USING (
        id = (SELECT auth.uid())
        OR (SELECT private.is_admin())
        OR (dealership_id IS NOT NULL AND dealership_id = (SELECT private.current_dealership_id()))
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'profiles_update') THEN
    CREATE POLICY profiles_update ON public.profiles
      FOR UPDATE TO authenticated
      USING (id = (SELECT auth.uid()) OR (SELECT private.is_admin()))
      WITH CHECK (
        (SELECT private.is_admin())
        OR (
          id = (SELECT auth.uid())
          AND role = (SELECT private.current_user_role())
          AND dealership_id IS NOT DISTINCT FROM (SELECT private.current_dealership_id())
        )
      );
  END IF;
END $$;

-- user_consents
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_consents' AND policyname = 'user_consents_select') THEN
    CREATE POLICY user_consents_select ON public.user_consents
      FOR SELECT TO authenticated
      USING (user_id = (SELECT auth.uid()) OR (SELECT private.is_admin()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_consents' AND policyname = 'user_consents_insert') THEN
    CREATE POLICY user_consents_insert ON public.user_consents
      FOR INSERT TO authenticated
      WITH CHECK (user_id = (SELECT auth.uid()) OR (SELECT private.is_admin()));
  END IF;
END $$;

-- kyc_submissions
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'kyc_submissions' AND policyname = 'kyc_submissions_select') THEN
    CREATE POLICY kyc_submissions_select ON public.kyc_submissions
      FOR SELECT TO authenticated
      USING (user_id = (SELECT auth.uid()) OR (SELECT private.is_admin()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'kyc_submissions' AND policyname = 'kyc_submissions_insert') THEN
    CREATE POLICY kyc_submissions_insert ON public.kyc_submissions
      FOR INSERT TO authenticated
      WITH CHECK (user_id = (SELECT auth.uid()) AND status IN ('PENDING', 'NOT_STARTED'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'kyc_submissions' AND policyname = 'kyc_submissions_update') THEN
    CREATE POLICY kyc_submissions_update ON public.kyc_submissions
      FOR UPDATE TO authenticated
      USING ((user_id = (SELECT auth.uid()) AND status <> 'VERIFIED') OR (SELECT private.is_admin()))
      WITH CHECK ((user_id = (SELECT auth.uid()) AND status = 'PENDING') OR (SELECT private.is_admin()));
  END IF;
END $$;

-- dealerships
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'dealerships' AND policyname = 'dealerships_select') THEN
    CREATE POLICY dealerships_select ON public.dealerships
      FOR SELECT TO authenticated
      USING (
        status = 'VERIFIED'
        OR id = (SELECT private.current_dealership_id())
        OR (SELECT private.is_admin())
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'dealerships' AND policyname = 'dealerships_insert') THEN
    CREATE POLICY dealerships_insert ON public.dealerships
      FOR INSERT TO authenticated
      WITH CHECK (status = 'PENDING');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'dealerships' AND policyname = 'dealerships_update') THEN
    CREATE POLICY dealerships_update ON public.dealerships
      FOR UPDATE TO authenticated
      USING ((SELECT private.is_dealer_admin_of(id)) OR (SELECT private.is_admin()))
      WITH CHECK (
        (SELECT private.is_admin())
        OR ((SELECT private.is_dealer_admin_of(id)) AND status = (SELECT d.status FROM public.dealerships d WHERE d.id = dealerships.id))
      );
  END IF;
END $$;

-- dealership_members
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'dealership_members' AND policyname = 'dealership_members_select') THEN
    CREATE POLICY dealership_members_select ON public.dealership_members
      FOR SELECT TO authenticated
      USING (dealership_id = (SELECT private.current_dealership_id()) OR (SELECT private.is_admin()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'dealership_members' AND policyname = 'dealership_members_insert') THEN
    CREATE POLICY dealership_members_insert ON public.dealership_members
      FOR INSERT TO authenticated
      WITH CHECK ((SELECT private.is_dealer_admin_of(dealership_id)) OR (SELECT private.is_admin()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'dealership_members' AND policyname = 'dealership_members_update') THEN
    CREATE POLICY dealership_members_update ON public.dealership_members
      FOR UPDATE TO authenticated
      USING ((SELECT private.is_dealer_admin_of(dealership_id)) OR (SELECT private.is_admin()))
      WITH CHECK ((SELECT private.is_dealer_admin_of(dealership_id)) OR (SELECT private.is_admin()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'dealership_members' AND policyname = 'dealership_members_delete') THEN
    CREATE POLICY dealership_members_delete ON public.dealership_members
      FOR DELETE TO authenticated
      USING ((SELECT private.is_dealer_admin_of(dealership_id)) OR (SELECT private.is_admin()));
  END IF;
END $$;

-- subscriptions & payments
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'subscriptions' AND policyname = 'subscriptions_select') THEN
    CREATE POLICY subscriptions_select ON public.subscriptions
      FOR SELECT TO authenticated
      USING (dealership_id = (SELECT private.current_dealership_id()) OR (SELECT private.is_admin()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'subscriptions' AND policyname = 'subscriptions_admin_write') THEN
    CREATE POLICY subscriptions_admin_write ON public.subscriptions
      FOR ALL TO authenticated
      USING ((SELECT private.is_admin()))
      WITH CHECK ((SELECT private.is_admin()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'payments' AND policyname = 'payments_select') THEN
    CREATE POLICY payments_select ON public.payments
      FOR SELECT TO authenticated
      USING (dealership_id = (SELECT private.current_dealership_id()) OR (SELECT private.is_admin()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'payments' AND policyname = 'payments_admin_write') THEN
    CREATE POLICY payments_admin_write ON public.payments
      FOR ALL TO authenticated
      USING ((SELECT private.is_admin()))
      WITH CHECK ((SELECT private.is_admin()));
  END IF;
END $$;

-- listings (uses private.dealer_has_bid_on_listing to prevent recursion with bids)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'listings' AND policyname = 'listings_select') THEN
    CREATE POLICY listings_select ON public.listings
      FOR SELECT TO authenticated
      USING (
        seller_id = (SELECT auth.uid())
        OR (SELECT private.is_admin())
        OR (
          (SELECT private.is_verified_dealer())
          AND (
            status = 'ACTIVE'
            OR (SELECT private.dealer_has_bid_on_listing(id))
          )
        )
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'listings' AND policyname = 'listings_insert') THEN
    CREATE POLICY listings_insert ON public.listings
      FOR INSERT TO authenticated
      WITH CHECK (
        seller_id = (SELECT auth.uid())
        AND status IN ('DRAFT', 'PENDING_MODERATION')
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'listings' AND policyname = 'listings_update') THEN
    CREATE POLICY listings_update ON public.listings
      FOR UPDATE TO authenticated
      USING (
        (seller_id = (SELECT auth.uid()) AND status IN ('DRAFT', 'PENDING_MODERATION', 'EDITS_REQUESTED'))
        OR (SELECT private.is_admin())
      )
      WITH CHECK (
        (SELECT private.is_admin())
        OR (
          seller_id = (SELECT auth.uid())
          AND status IN ('DRAFT', 'PENDING_MODERATION', 'CANCELLED')
        )
      );
  END IF;
END $$;

-- listing_media & damage_hotspots
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'listing_media' AND policyname = 'listing_media_select') THEN
    CREATE POLICY listing_media_select ON public.listing_media
      FOR SELECT TO authenticated
      USING (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'listing_media' AND policyname = 'listing_media_write') THEN
    CREATE POLICY listing_media_write ON public.listing_media
      FOR ALL TO authenticated
      USING ((SELECT private.is_listing_editable_by_owner(listing_id)) OR (SELECT private.is_admin()))
      WITH CHECK ((SELECT private.is_listing_editable_by_owner(listing_id)) OR (SELECT private.is_admin()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'damage_hotspots' AND policyname = 'damage_hotspots_select') THEN
    CREATE POLICY damage_hotspots_select ON public.damage_hotspots
      FOR SELECT TO authenticated
      USING (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'damage_hotspots' AND policyname = 'damage_hotspots_write') THEN
    CREATE POLICY damage_hotspots_write ON public.damage_hotspots
      FOR ALL TO authenticated
      USING ((SELECT private.is_listing_editable_by_owner(listing_id)) OR (SELECT private.is_admin()))
      WITH CHECK ((SELECT private.is_listing_editable_by_owner(listing_id)) OR (SELECT private.is_admin()));
  END IF;
END $$;

-- bids (CRITICAL SEALED-BID SECRECY — H1 / BR-04)
-- No direct INSERT/UPDATE/DELETE policies for authenticated; all writes go through submit_dealer_bid() RPC.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'bids' AND policyname = 'bids_sealed_select') THEN
    CREATE POLICY bids_sealed_select ON public.bids
      FOR SELECT TO authenticated
      USING (
        (SELECT private.is_admin())
        OR dealership_id = (SELECT private.current_dealership_id())
        OR (SELECT private.is_unsealed_seller_listing(listing_id))
      );
  END IF;
END $$;

-- matches
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'matches' AND policyname = 'matches_select') THEN
    CREATE POLICY matches_select ON public.matches
      FOR SELECT TO authenticated
      USING (
        seller_id = (SELECT auth.uid())
        OR dealership_id = (SELECT private.current_dealership_id())
        OR (SELECT private.is_admin())
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'matches' AND policyname = 'matches_update') THEN
    CREATE POLICY matches_update ON public.matches
      FOR UPDATE TO authenticated
      USING (
        dealership_id = (SELECT private.current_dealership_id())
        OR (SELECT private.is_admin())
      )
      WITH CHECK (
        dealership_id = (SELECT private.current_dealership_id())
        OR (SELECT private.is_admin())
      );
  END IF;
END $$;

-- disputes & dispute_timeline
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'disputes' AND policyname = 'disputes_select') THEN
    CREATE POLICY disputes_select ON public.disputes
      FOR SELECT TO authenticated
      USING ((SELECT private.is_match_participant(match_id)) OR (SELECT private.is_admin()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'disputes' AND policyname = 'disputes_insert') THEN
    CREATE POLICY disputes_insert ON public.disputes
      FOR INSERT TO authenticated
      WITH CHECK (
        (raised_by_user_id = (SELECT auth.uid()) AND (SELECT private.is_match_participant(match_id)))
        OR (SELECT private.is_admin())
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'disputes' AND policyname = 'disputes_admin_update') THEN
    CREATE POLICY disputes_admin_update ON public.disputes
      FOR UPDATE TO authenticated
      USING ((SELECT private.is_admin()))
      WITH CHECK ((SELECT private.is_admin()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'dispute_timeline' AND policyname = 'dispute_timeline_select') THEN
    CREATE POLICY dispute_timeline_select ON public.dispute_timeline
      FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.disputes d
          WHERE d.id = dispute_id
            AND ((SELECT private.is_match_participant(d.match_id)) OR (SELECT private.is_admin()))
        )
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'dispute_timeline' AND policyname = 'dispute_timeline_insert') THEN
    CREATE POLICY dispute_timeline_insert ON public.dispute_timeline
      FOR INSERT TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.disputes d
          WHERE d.id = dispute_id
            AND ((SELECT private.is_match_participant(d.match_id)) OR (SELECT private.is_admin()))
        )
      );
  END IF;
END $$;

-- notifications
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'notifications' AND policyname = 'notifications_select') THEN
    CREATE POLICY notifications_select ON public.notifications
      FOR SELECT TO authenticated
      USING (user_id = (SELECT auth.uid()) OR (SELECT private.is_admin()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'notifications' AND policyname = 'notifications_update') THEN
    CREATE POLICY notifications_update ON public.notifications
      FOR UPDATE TO authenticated
      USING (user_id = (SELECT auth.uid()) OR (SELECT private.is_admin()))
      WITH CHECK (user_id = (SELECT auth.uid()) OR (SELECT private.is_admin()));
  END IF;
END $$;

-- audit_logs (Admin SELECT only; writes exclusively via SECURITY DEFINER RPCs or service_role)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'audit_logs' AND policyname = 'audit_logs_admin_select') THEN
    CREATE POLICY audit_logs_admin_select ON public.audit_logs
      FOR SELECT TO authenticated
      USING ((SELECT private.is_admin()));
  END IF;
END $$;

-- 5. Safe Public Telemetry View (count + status + end time only, zero amounts)
CREATE OR REPLACE VIEW public.public_auction_telemetry
WITH (security_invoker = true) AS
SELECT
  id AS listing_id,
  status,
  auction_started_at,
  auction_ends_at,
  closed_at,
  bid_count
FROM public.listings;

GRANT SELECT ON public.public_auction_telemetry TO authenticated;
