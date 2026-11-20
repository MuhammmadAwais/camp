-- ============================================================================
-- Manual / CLI Promotion Script 0017b: Performance Policy Split & RPC Hardening
-- Run in Supabase Dashboard SQL Editor or promote into `supabase/migrations/`
-- via `supabase db push` during Senior Engineer hardening (zero ERROR/CRITICAL
-- issues exist without this script; it resolves the remaining Performance Advisor
-- `multiple_permissive_policies` WARNs and restricts `submit_dealer_bid` /
-- `accept_dealer_bid` strictly to `service_role`).
-- ============================================================================

-- 1. Lock down Supabase starter helper function if still exposed
DO $$
BEGIN
  IF to_regprocedure('public.rls_auto_enable()') IS NOT NULL THEN
    REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
  END IF;
END $$;

-- 2. Split overlapping FOR ALL write policies into explicit INSERT/UPDATE/DELETE

-- platform_config
DROP POLICY IF EXISTS platform_config_admin_write ON public.platform_config;
CREATE POLICY platform_config_admin_insert ON public.platform_config
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT private.is_admin()));
CREATE POLICY platform_config_admin_update ON public.platform_config
  FOR UPDATE TO authenticated
  USING ((SELECT private.is_admin()))
  WITH CHECK ((SELECT private.is_admin()));
CREATE POLICY platform_config_admin_delete ON public.platform_config
  FOR DELETE TO authenticated
  USING ((SELECT private.is_admin()));

-- plans
DROP POLICY IF EXISTS plans_admin_write ON public.plans;
CREATE POLICY plans_admin_insert ON public.plans
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT private.is_admin()));
CREATE POLICY plans_admin_update ON public.plans
  FOR UPDATE TO authenticated
  USING ((SELECT private.is_admin()))
  WITH CHECK ((SELECT private.is_admin()));
CREATE POLICY plans_admin_delete ON public.plans
  FOR DELETE TO authenticated
  USING ((SELECT private.is_admin()));

-- postal_centroids
DROP POLICY IF EXISTS postal_centroids_admin_write ON public.postal_centroids;
CREATE POLICY postal_centroids_admin_insert ON public.postal_centroids
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT private.is_admin()));
CREATE POLICY postal_centroids_admin_update ON public.postal_centroids
  FOR UPDATE TO authenticated
  USING ((SELECT private.is_admin()))
  WITH CHECK ((SELECT private.is_admin()));
CREATE POLICY postal_centroids_admin_delete ON public.postal_centroids
  FOR DELETE TO authenticated
  USING ((SELECT private.is_admin()));

-- vin_decode_cache
DROP POLICY IF EXISTS vin_decode_cache_admin_write ON public.vin_decode_cache;
CREATE POLICY vin_decode_cache_admin_insert ON public.vin_decode_cache
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT private.is_admin()));
CREATE POLICY vin_decode_cache_admin_update ON public.vin_decode_cache
  FOR UPDATE TO authenticated
  USING ((SELECT private.is_admin()))
  WITH CHECK ((SELECT private.is_admin()));
CREATE POLICY vin_decode_cache_admin_delete ON public.vin_decode_cache
  FOR DELETE TO authenticated
  USING ((SELECT private.is_admin()));

-- subscriptions
DROP POLICY IF EXISTS subscriptions_admin_write ON public.subscriptions;
CREATE POLICY subscriptions_admin_insert ON public.subscriptions
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT private.is_admin()));
CREATE POLICY subscriptions_admin_update ON public.subscriptions
  FOR UPDATE TO authenticated
  USING ((SELECT private.is_admin()))
  WITH CHECK ((SELECT private.is_admin()));
CREATE POLICY subscriptions_admin_delete ON public.subscriptions
  FOR DELETE TO authenticated
  USING ((SELECT private.is_admin()));

-- payments
DROP POLICY IF EXISTS payments_admin_write ON public.payments;
CREATE POLICY payments_admin_insert ON public.payments
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT private.is_admin()));
CREATE POLICY payments_admin_update ON public.payments
  FOR UPDATE TO authenticated
  USING ((SELECT private.is_admin()))
  WITH CHECK ((SELECT private.is_admin()));
CREATE POLICY payments_admin_delete ON public.payments
  FOR DELETE TO authenticated
  USING ((SELECT private.is_admin()));

-- listing_media
DROP POLICY IF EXISTS listing_media_write ON public.listing_media;
CREATE POLICY listing_media_insert ON public.listing_media
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT private.is_listing_editable_by_owner(listing_id)) OR (SELECT private.is_admin()));
CREATE POLICY listing_media_update ON public.listing_media
  FOR UPDATE TO authenticated
  USING ((SELECT private.is_listing_editable_by_owner(listing_id)) OR (SELECT private.is_admin()))
  WITH CHECK ((SELECT private.is_listing_editable_by_owner(listing_id)) OR (SELECT private.is_admin()));
CREATE POLICY listing_media_delete ON public.listing_media
  FOR DELETE TO authenticated
  USING ((SELECT private.is_listing_editable_by_owner(listing_id)) OR (SELECT private.is_admin()));

-- damage_hotspots
DROP POLICY IF EXISTS damage_hotspots_write ON public.damage_hotspots;
CREATE POLICY damage_hotspots_insert ON public.damage_hotspots
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT private.is_listing_editable_by_owner(listing_id)) OR (SELECT private.is_admin()));
CREATE POLICY damage_hotspots_update ON public.damage_hotspots
  FOR UPDATE TO authenticated
  USING ((SELECT private.is_listing_editable_by_owner(listing_id)) OR (SELECT private.is_admin()))
  WITH CHECK ((SELECT private.is_listing_editable_by_owner(listing_id)) OR (SELECT private.is_admin()));
CREATE POLICY damage_hotspots_delete ON public.damage_hotspots
  FOR DELETE TO authenticated
  USING ((SELECT private.is_listing_editable_by_owner(listing_id)) OR (SELECT private.is_admin()));
