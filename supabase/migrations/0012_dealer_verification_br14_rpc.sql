-- ============================================================================
-- Migration 0012: Dealership License Transition & Atomic BR-14 Bid Voiding RPC
-- Implements BR-14: Suspending or revoking a dealership atomically voids all
-- ACTIVE bids from that dealership and decrements affected listings.bid_count.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.transition_dealership_status_and_void_bids(
  p_dealership_id uuid,
  p_new_status public.dealership_status,
  p_admin_id uuid,
  p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_prev_status public.dealership_status;
  v_voided_count integer := 0;
  v_voided_bid_ids uuid[] := ARRAY[]::uuid[];
  v_affected_listing_ids uuid[] := ARRAY[]::uuid[];
BEGIN
  IF p_new_status NOT IN ('SUSPENDED', 'REVOKED') THEN
    RAISE EXCEPTION 'INVALID_TRANSITION_STATUS: Expected SUSPENDED or REVOKED';
  END IF;

  SELECT d.status
  INTO v_prev_status
  FROM public.dealerships d
  WHERE d.id = p_dealership_id
  FOR UPDATE;

  IF v_prev_status IS NULL THEN
    RAISE EXCEPTION 'DEALERSHIP_NOT_FOUND: Dealership not found';
  END IF;

  IF v_prev_status = 'REVOKED' AND p_new_status = 'SUSPENDED' THEN
    RAISE EXCEPTION 'DEALERSHIP_ALREADY_REVOKED: Revoked dealerships cannot be downgraded to SUSPENDED';
  END IF;

  UPDATE public.dealerships
  SET
    status = p_new_status,
    verification_notes = COALESCE(NULLIF(btrim(p_notes), ''), verification_notes),
    verified_by = p_admin_id,
    updated_at = now()
  WHERE id = p_dealership_id;

  WITH voided AS (
    UPDATE public.bids
    SET
      status = 'VOIDED',
      updated_at = now()
    WHERE dealership_id = p_dealership_id
      AND status = 'ACTIVE'
    RETURNING id, listing_id
  ),
  per_listing AS (
    SELECT
      v.listing_id,
      count(*)::integer AS voided_count
    FROM voided v
    GROUP BY v.listing_id
  ),
  updated_listings AS (
    UPDATE public.listings l
    SET
      bid_count = GREATEST(0, l.bid_count - pl.voided_count),
      updated_at = now()
    FROM per_listing pl
    WHERE l.id = pl.listing_id
    RETURNING l.id
  )
  SELECT
    COALESCE((SELECT count(*)::integer FROM voided), 0),
    COALESCE((SELECT array_agg(v.id ORDER BY v.id) FROM voided v), ARRAY[]::uuid[]),
    COALESCE((SELECT array_agg(ul.id ORDER BY ul.id) FROM updated_listings ul), ARRAY[]::uuid[])
  INTO v_voided_count, v_voided_bid_ids, v_affected_listing_ids;

  RETURN jsonb_build_object(
    'dealership_id', p_dealership_id,
    'previous_status', v_prev_status::text,
    'new_status', p_new_status::text,
    'voided_bids_count', v_voided_count,
    'voided_bid_ids', to_jsonb(v_voided_bid_ids),
    'affected_listing_ids', to_jsonb(v_affected_listing_ids)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.transition_dealership_status_and_void_bids(uuid, public.dealership_status, uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.transition_dealership_status_and_void_bids(uuid, public.dealership_status, uuid, text) TO service_role;
