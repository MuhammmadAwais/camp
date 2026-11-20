-- ============================================================================
-- Migration 0005: Auth Triggers & Atomic Concurrency-Safe Postgres RPCs
-- Covers: handle_new_auth_user, sync_profile_claims_to_auth,
--         submit_dealer_bid, accept_dealer_bid,
--         close_expired_auctions, expire_overdue_matches
-- ============================================================================

-- 1. Auto-create profile when a user signs up in auth.users
-- Never trusts raw_user_meta_data for authorization role; defaults strictly to 'SELLER'
-- unless raw_app_meta_data->>'role' explicitly specifies a valid role.
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_role public.user_role := 'SELLER';
  v_app_role text;
  v_dealership_id uuid := NULL;
BEGIN
  v_app_role := NEW.raw_app_meta_data ->> 'role';
  IF v_app_role IN ('SELLER', 'DEALER_ADMIN', 'DEALER_AGENT', 'ADMIN') THEN
    v_role := v_app_role::public.user_role;
  END IF;

  IF (NEW.raw_app_meta_data ->> 'dealership_id') ~* '^[0-9a-f-]{36}$' THEN
    v_dealership_id := (NEW.raw_app_meta_data ->> 'dealership_id')::uuid;
  END IF;

  INSERT INTO public.profiles (
    id,
    email,
    first_name,
    last_name,
    phone_e164,
    postal_code,
    province,
    role,
    dealership_id,
    email_verified,
    marketing_opt_in
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
    NEW.raw_user_meta_data ->> 'phone_e164',
    NEW.raw_user_meta_data ->> 'postal_code',
    NEW.raw_user_meta_data ->> 'province',
    v_role,
    v_dealership_id,
    (NEW.email_confirmed_at IS NOT NULL),
    COALESCE((NEW.raw_user_meta_data ->> 'marketing_opt_in')::boolean, false)
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- 2. Keep JWT raw_app_meta_data synchronized with profiles.role & dealership_id
CREATE OR REPLACE FUNCTION public.sync_profile_claims_to_auth()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT'
     OR OLD.role IS DISTINCT FROM NEW.role
     OR OLD.dealership_id IS DISTINCT FROM NEW.dealership_id THEN
    UPDATE auth.users
    SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb)
      || jsonb_build_object(
        'role', NEW.role::text,
        'dealership_id', NEW.dealership_id
      )
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_sync_profile_claims_to_auth
  AFTER INSERT OR UPDATE OF role, dealership_id ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_claims_to_auth();

-- 3. Atomic Upward-Only Sealed Bid RPC (H2, BR-05, BR-06, NFR-02, NFR-15)
CREATE OR REPLACE FUNCTION public.submit_dealer_bid(
  p_listing_id uuid,
  p_amount_cents bigint,
  p_idempotency_key text,
  p_conditions text DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor_id uuid;
  v_actor_name text;
  v_actor_role text;
  v_dealership_id uuid;
  v_dealership_status public.dealership_status;
  v_dealership_province text;
  v_seat_role public.dealer_seat_role;
  v_seat_active boolean;
  v_sub_id uuid;
  v_sub_status public.subscription_status;
  v_sub_period_end timestamptz;
  v_bids_used integer;
  v_bid_quota integer;
  v_listing_status public.listing_status;
  v_auction_ends_at timestamptz;
  v_listing_province text;
  v_existing_bid RECORD;
  v_new_bid_id uuid;
  v_now timestamptz := now();
BEGIN
  v_actor_id := auth.uid();
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED: Authentication required to place a bid';
  END IF;

  IF p_amount_cents IS NULL OR p_amount_cents <= 0 THEN
    RAISE EXCEPTION 'INVALID_BID_AMOUNT: Bid amount in cents must be greater than zero';
  END IF;

  IF p_idempotency_key IS NULL OR btrim(p_idempotency_key) = '' THEN
    RAISE EXCEPTION 'INVALID_IDEMPOTENCY_KEY: Idempotency key is required';
  END IF;

  -- Load caller profile & dealership membership
  SELECT
    p.dealership_id,
    p.role::text,
    NULLIF(btrim(concat_ws(' ', p.first_name, p.last_name)), ''),
    d.status,
    d.province
  INTO
    v_dealership_id,
    v_actor_role,
    v_actor_name,
    v_dealership_status,
    v_dealership_province
  FROM public.profiles p
  LEFT JOIN public.dealerships d ON d.id = p.dealership_id
  WHERE p.id = v_actor_id
    AND p.account_status = 'ACTIVE';

  IF v_dealership_id IS NULL OR v_actor_role NOT IN ('DEALER_ADMIN', 'DEALER_AGENT') THEN
    RAISE EXCEPTION 'FORBIDDEN: Active dealership account required';
  END IF;

  IF v_dealership_status <> 'VERIFIED' THEN
    RAISE EXCEPTION 'DEALERSHIP_NOT_VERIFIED: Dealership licence verification is pending or suspended';
  END IF;

  -- Verify seat permission (DEALER_INSPECTOR cannot place bids)
  SELECT dm.seat_role, dm.is_active
  INTO v_seat_role, v_seat_active
  FROM public.dealership_members dm
  WHERE dm.dealership_id = v_dealership_id
    AND dm.user_id = v_actor_id;

  IF v_seat_role IS NOT NULL AND (NOT v_seat_active OR v_seat_role = 'DEALER_INSPECTOR') THEN
    RAISE EXCEPTION 'FORBIDDEN_INSPECTOR_BID: Only dealership admins and wholesale buyers can place bids';
  END IF;

  -- Fast idempotency check (after validating dealership ownership)
  SELECT id, listing_id, amount_cents, version, revision_count, COALESCE(revised_at, created_at) AS placed_at
  INTO v_existing_bid
  FROM public.bids
  WHERE idempotency_key = p_idempotency_key
    AND dealership_id = v_dealership_id;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'success', true,
      'idempotent', true,
      'bid_id', v_existing_bid.id,
      'listing_id', v_existing_bid.listing_id,
      'amount_cents', v_existing_bid.amount_cents,
      'version', v_existing_bid.version,
      'revision_count', v_existing_bid.revision_count,
      'placed_at', v_existing_bid.placed_at
    );
  END IF;

  -- Verify active dealership subscription & lock subscription row for quota safety
  SELECT s.id, s.status, s.current_period_end, s.bids_used, pl.monthly_bid_quota
  INTO v_sub_id, v_sub_status, v_sub_period_end, v_bids_used, v_bid_quota
  FROM public.subscriptions s
  JOIN public.plans pl ON pl.id = s.plan_id
  WHERE s.dealership_id = v_dealership_id
  FOR UPDATE OF s;

  IF v_sub_id IS NULL OR v_sub_status NOT IN ('ACTIVE', 'TRIALING') OR v_sub_period_end <= v_now THEN
    RAISE EXCEPTION 'SUBSCRIPTION_PAST_DUE: Dealership subscription is inactive or past due';
  END IF;

  -- Lock listing row in SHARE mode so auction cannot close mid-transaction
  SELECT status, auction_ends_at, province
  INTO v_listing_status, v_auction_ends_at, v_listing_province
  FROM public.listings
  WHERE id = p_listing_id
  FOR SHARE;

  IF v_listing_status IS NULL THEN
    RAISE EXCEPTION 'LISTING_NOT_FOUND: Vehicle listing not found';
  END IF;

  IF v_listing_status <> 'ACTIVE' OR v_auction_ends_at IS NULL OR v_now >= v_auction_ends_at THEN
    RAISE EXCEPTION 'AUCTION_NOT_ACTIVE: Auction window is not active';
  END IF;

  -- Lock dealer's existing bid row on this listing (if any)
  SELECT id, amount_cents, version, revision_count
  INTO v_existing_bid
  FROM public.bids
  WHERE listing_id = p_listing_id
    AND dealership_id = v_dealership_id
  FOR UPDATE;

  IF FOUND THEN
    IF p_amount_cents <= v_existing_bid.amount_cents THEN
      RAISE EXCEPTION 'BID_MUST_INCREASE: Revised bid (%) must exceed current bid (%)', p_amount_cents, v_existing_bid.amount_cents;
    END IF;

    UPDATE public.bids
    SET
      amount_cents = p_amount_cents,
      placed_by_user_id = v_actor_id,
      conditions = COALESCE(p_conditions, conditions),
      notes = COALESCE(p_notes, notes),
      version = v_existing_bid.version + 1,
      revision_count = v_existing_bid.revision_count + 1,
      idempotency_key = p_idempotency_key,
      revised_at = v_now
    WHERE id = v_existing_bid.id
    RETURNING id, amount_cents, version, revision_count
    INTO v_new_bid_id, p_amount_cents, v_existing_bid.version, v_existing_bid.revision_count;

    INSERT INTO public.audit_logs (
      actor_id, actor_name, actor_role, action, entity_type, entity_id,
      before_json, after_json, details, provincial_jurisdiction
    )
    VALUES (
      v_actor_id,
      COALESCE(v_actor_name, v_actor_id::text),
      v_actor_role,
      'SEALED_BID_REVISED',
      'BID',
      v_new_bid_id::text,
      jsonb_build_object('amount_cents', v_existing_bid.amount_cents, 'version', v_existing_bid.version - 1),
      jsonb_build_object('amount_cents', p_amount_cents, 'version', v_existing_bid.version, 'listing_id', p_listing_id),
      format('Upward sealed bid revision on listing %s', p_listing_id),
      COALESCE(v_dealership_province, v_listing_province)
    );

    RETURN jsonb_build_object(
      'success', true,
      'idempotent', false,
      'bid_id', v_new_bid_id,
      'listing_id', p_listing_id,
      'amount_cents', p_amount_cents,
      'version', v_existing_bid.version,
      'revision_count', v_existing_bid.revision_count,
      'placed_at', v_now
    );
  ELSE
    -- New bid consumes 1 unit from monthly quota
    IF v_bids_used >= v_bid_quota THEN
      RAISE EXCEPTION 'QUOTA_EXCEEDED: Monthly dealership bid quota (%) exhausted', v_bid_quota;
    END IF;

    INSERT INTO public.bids (
      listing_id,
      dealership_id,
      placed_by_user_id,
      amount_cents,
      conditions,
      notes,
      status,
      idempotency_key
    )
    VALUES (
      p_listing_id,
      v_dealership_id,
      v_actor_id,
      p_amount_cents,
      p_conditions,
      p_notes,
      'ACTIVE',
      p_idempotency_key
    )
    RETURNING id INTO v_new_bid_id;

    UPDATE public.listings
    SET bid_count = bid_count + 1
    WHERE id = p_listing_id;

    UPDATE public.subscriptions
    SET bids_used = bids_used + 1
    WHERE id = v_sub_id;

    INSERT INTO public.audit_logs (
      actor_id, actor_name, actor_role, action, entity_type, entity_id,
      after_json, details, provincial_jurisdiction
    )
    VALUES (
      v_actor_id,
      COALESCE(v_actor_name, v_actor_id::text),
      v_actor_role,
      'SEALED_BID_PLACED',
      'BID',
      v_new_bid_id::text,
      jsonb_build_object('amount_cents', p_amount_cents, 'listing_id', p_listing_id, 'dealership_id', v_dealership_id),
      format('Initial sealed bid placed on listing %s', p_listing_id),
      COALESCE(v_dealership_province, v_listing_province)
    );

    RETURN jsonb_build_object(
      'success', true,
      'idempotent', false,
      'bid_id', v_new_bid_id,
      'listing_id', p_listing_id,
      'amount_cents', p_amount_cents,
      'version', 1,
      'revision_count', 0,
      'placed_at', v_now
    );
  END IF;
END;
$$;

-- 4. Atomic Seller Dealer Selection & Voucher Creation RPC (FR-EU-09, FR-EU-10, BR-08)
CREATE OR REPLACE FUNCTION public.accept_dealer_bid(
  p_listing_id uuid,
  p_bid_id uuid,
  p_selection_reason text DEFAULT 'HIGHEST'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor_id uuid;
  v_seller_name text;
  v_listing RECORD;
  v_bid RECORD;
  v_existing_match uuid;
  v_window_hours integer := 24;
  v_accept_expires_at timestamptz;
  v_voucher_code text;
  v_match_id uuid;
  v_reason text;
  v_now timestamptz := now();
BEGIN
  v_actor_id := auth.uid();
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED: Authentication required';
  END IF;

  v_reason := CASE
    WHEN p_selection_reason IN ('HIGHEST', 'NEAREST', 'OTHER') THEN p_selection_reason
    ELSE 'HIGHEST'
  END;

  -- Lock listing row exclusively
  SELECT id, seller_id, status, province
  INTO v_listing
  FROM public.listings
  WHERE id = p_listing_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'LISTING_NOT_FOUND: Listing not found';
  END IF;

  IF v_listing.seller_id <> v_actor_id THEN
    RAISE EXCEPTION 'FORBIDDEN: Only the listing owner may accept a dealer offer';
  END IF;

  IF v_listing.status <> 'UNSEALED' THEN
    RAISE EXCEPTION 'AUCTION_NOT_UNSEALED: Auction must be UNSEALED before accepting an offer (current: %)', v_listing.status;
  END IF;

  SELECT id INTO v_existing_match
  FROM public.matches
  WHERE listing_id = p_listing_id;

  IF v_existing_match IS NOT NULL THEN
    RAISE EXCEPTION 'MATCH_ALREADY_EXISTS: A dealership match already exists for this listing';
  END IF;

  -- Lock selected bid row
  SELECT id, dealership_id, amount_cents, status
  INTO v_bid
  FROM public.bids
  WHERE id = p_bid_id
    AND listing_id = p_listing_id
  FOR UPDATE;

  IF NOT FOUND OR v_bid.status NOT IN ('ACTIVE', 'EXPIRED') THEN
    RAISE EXCEPTION 'BID_NOT_FOUND: Selected bid is not eligible for acceptance';
  END IF;

  SELECT COALESCE((value_json)::integer, 24)
  INTO v_window_hours
  FROM public.platform_config
  WHERE key = 'acceptance_window_hours';

  v_accept_expires_at := v_now + make_interval(hours => COALESCE(v_window_hours, 24));
  v_voucher_code := format('ANX-%s-%s', upper(COALESCE(NULLIF(v_listing.province, ''), 'CA')), upper(encode(extensions.gen_random_bytes(3), 'hex')));

  INSERT INTO public.matches (
    listing_id,
    winning_bid_id,
    dealership_id,
    seller_id,
    voucher_code,
    selection_reason,
    agreed_amount_cents,
    accept_expires_at,
    outcome
  )
  VALUES (
    p_listing_id,
    v_bid.id,
    v_bid.dealership_id,
    v_actor_id,
    v_voucher_code,
    v_reason,
    v_bid.amount_cents,
    v_accept_expires_at,
    'APPOINTMENT_CONFIRMED'
  )
  RETURNING id INTO v_match_id;

  UPDATE public.bids
  SET status = CASE WHEN id = v_bid.id THEN 'WON'::public.bid_status ELSE 'LOST'::public.bid_status END
  WHERE listing_id = p_listing_id
    AND status IN ('ACTIVE', 'EXPIRED');

  UPDATE public.listings
  SET status = 'ACCEPTED'
  WHERE id = p_listing_id;

  SELECT NULLIF(btrim(concat_ws(' ', first_name, last_name)), '')
  INTO v_seller_name
  FROM public.profiles
  WHERE id = v_actor_id;

  INSERT INTO public.audit_logs (
    actor_id, actor_name, actor_role, action, entity_type, entity_id,
    after_json, details, provincial_jurisdiction
  )
  VALUES (
    v_actor_id,
    COALESCE(v_seller_name, v_actor_id::text),
    'SELLER',
    'DEALER_BID_ACCEPTED',
    'MATCH',
    v_match_id::text,
    jsonb_build_object('listing_id', p_listing_id, 'bid_id', v_bid.id, 'dealership_id', v_bid.dealership_id, 'agreed_amount_cents', v_bid.amount_cents, 'voucher_code', v_voucher_code),
    format('Seller accepted dealer bid and generated appointment voucher %s', v_voucher_code),
    v_listing.province
  );

  RETURN jsonb_build_object(
    'success', true,
    'match_id', v_match_id,
    'voucher_code', v_voucher_code,
    'agreed_amount_cents', v_bid.amount_cents,
    'accept_expires_at', v_accept_expires_at,
    'dealership_id', v_bid.dealership_id
  );
END;
$$;

-- 5. Idempotent Scheduled Sweep: Close Expired Auctions (H3, H4, FR-X-02)
CREATE OR REPLACE FUNCTION private.close_expired_auctions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_closed_count integer := 0;
  v_row RECORD;
  v_now timestamptz := now();
BEGIN
  FOR v_row IN
    UPDATE public.listings
    SET
      status = 'UNSEALED',
      closed_at = v_now
    WHERE status = 'ACTIVE'
      AND auction_ends_at IS NOT NULL
      AND auction_ends_at <= v_now
    RETURNING id, province, bid_count
  LOOP
    v_closed_count := v_closed_count + 1;

    INSERT INTO public.audit_logs (
      actor_id, actor_name, actor_role, action, entity_type, entity_id,
      after_json, details, provincial_jurisdiction
    )
    VALUES (
      NULL,
      'pg_cron',
      'SYSTEM',
      'AUCTION_CLOSED_UNSEALED',
      'AUCTION',
      v_row.id::text,
      jsonb_build_object('status', 'UNSEALED', 'bid_count', v_row.bid_count, 'closed_at', v_now),
      format('24h auction window elapsed; unsealed %s dealer bids', v_row.bid_count),
      v_row.province
    );
  END LOOP;

  RETURN v_closed_count;
END;
$$;

-- 6. Idempotent Scheduled Sweep: Expire Overdue Acceptance Windows (BR-09, AC-05)
CREATE OR REPLACE FUNCTION private.expire_overdue_matches()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_expired_count integer := 0;
  v_row RECORD;
  v_now timestamptz := now();
BEGIN
  FOR v_row IN
    UPDATE public.matches
    SET
      outcome = 'EXPIRED',
      outcome_logged_at = v_now,
      outcome_notes = COALESCE(outcome_notes, '24-hour seller acceptance appointment window expired without recorded visit.')
    WHERE outcome = 'APPOINTMENT_CONFIRMED'
      AND accept_expires_at <= v_now
    RETURNING id, listing_id, dealership_id
  LOOP
    v_expired_count := v_expired_count + 1;

    UPDATE public.listings
    SET status = 'UNSEALED'
    WHERE id = v_row.listing_id
      AND status = 'ACCEPTED';

    INSERT INTO public.audit_logs (
      actor_id, actor_name, actor_role, action, entity_type, entity_id,
      after_json, details
    )
    VALUES (
      NULL,
      'pg_cron',
      'SYSTEM',
      'MATCH_ACCEPTANCE_EXPIRED',
      'MATCH',
      v_row.id::text,
      jsonb_build_object('listing_id', v_row.listing_id, 'dealership_id', v_row.dealership_id, 'outcome', 'EXPIRED'),
      'Acceptance window expired; listing released back to UNSEALED for next-ranked dealer or relist'
    );
  END LOOP;

  RETURN v_expired_count;
END;
$$;

-- Least-privilege function permissions
REVOKE ALL ON FUNCTION public.submit_dealer_bid(uuid, bigint, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_dealer_bid(uuid, bigint, text, text, text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.accept_dealer_bid(uuid, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.accept_dealer_bid(uuid, uuid, text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION private.close_expired_auctions() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.close_expired_auctions() TO postgres, service_role;

REVOKE ALL ON FUNCTION private.expire_overdue_matches() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.expire_overdue_matches() TO postgres, service_role;
