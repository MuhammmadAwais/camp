-- ============================================================================
-- Migration 0013: Admin Analytics SQL Views, Aggregation RPC & SHA-256 Audit Chain
-- Implements Prompt B6.2 (FR-AD-07, FR-AD-09, H8, NFR-11, NFR-14)
-- ============================================================================

-- 1. Deterministic SHA-256 hash computation for audit_logs rows.
-- Intentionally EXCLUDES `actor_id` so Migration 0010 (`ON DELETE SET NULL`
-- on `actor_id` after user erasure) never invalidates the tamper-evident hash chain.
CREATE OR REPLACE FUNCTION public.compute_audit_entry_hash(
  p_prev_hash text,
  p_id bigint,
  p_actor_name text,
  p_actor_role text,
  p_action text,
  p_entity_type text,
  p_entity_id text,
  p_before_json jsonb,
  p_after_json jsonb,
  p_details text,
  p_ip_address text,
  p_jurisdiction text,
  p_created_at timestamptz
)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  SELECT
    'sha256:' || encode(
      extensions.digest(
        convert_to(
          concat_ws(
            '|',
            COALESCE(NULLIF(btrim(p_prev_hash), ''), 'GENESIS:AUTONEXA_CAMP_AUDIT_LEDGER_V1'),
            COALESCE(p_id::text, ''),
            COALESCE(p_actor_name, ''),
            COALESCE(p_actor_role, ''),
            COALESCE(p_action, ''),
            COALESCE(p_entity_type, ''),
            COALESCE(p_entity_id, ''),
            COALESCE(p_before_json::text, ''),
            COALESCE(p_after_json::text, ''),
            COALESCE(p_details, ''),
            COALESCE(p_ip_address, ''),
            COALESCE(p_jurisdiction, ''),
            to_char(COALESCE(p_created_at, now()) AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')
          ),
          'UTF8'
        ),
        'sha256'
      ),
      'hex'
    );
$$;

-- 2. BEFORE INSERT trigger computing the chained SHA-256 digest on every new audit log
CREATE OR REPLACE FUNCTION public.set_audit_log_hash()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_prev_hash text;
BEGIN
  -- Serialize audit log appends so adjacent inserts chain strictly in id order
  PERFORM pg_advisory_xact_lock(hashtext('public.audit_logs_hash_chain'));

  NEW.created_at := COALESCE(NEW.created_at, now());

  SELECT a.immutable_hash
  INTO v_prev_hash
  FROM public.audit_logs a
  ORDER BY a.id DESC
  LIMIT 1;

  v_prev_hash := COALESCE(NULLIF(btrim(v_prev_hash), ''), 'GENESIS:AUTONEXA_CAMP_AUDIT_LEDGER_V1');

  NEW.immutable_hash := public.compute_audit_entry_hash(
    v_prev_hash,
    NEW.id,
    NEW.actor_name,
    NEW.actor_role,
    NEW.action,
    NEW.entity_type,
    NEW.entity_id,
    NEW.before_json,
    NEW.after_json,
    NEW.details,
    NEW.ip_address,
    NEW.provincial_jurisdiction,
    NEW.created_at
  );

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_audit_logs_compute_hash
  BEFORE INSERT ON public.audit_logs
  FOR EACH ROW EXECUTE FUNCTION public.set_audit_log_hash();

-- 3. One-time historical backfill of existing audit_logs rows, preserving immutability afterward
ALTER TABLE public.audit_logs DISABLE TRIGGER trg_audit_logs_immutable;

DO $$
DECLARE
  v_prev text := 'GENESIS:AUTONEXA_CAMP_AUDIT_LEDGER_V1';
  v_hash text;
  v_rec RECORD;
BEGIN
  FOR v_rec IN
    SELECT *
    FROM public.audit_logs
    ORDER BY id ASC
  LOOP
    v_hash := public.compute_audit_entry_hash(
      v_prev,
      v_rec.id,
      v_rec.actor_name,
      v_rec.actor_role,
      v_rec.action,
      v_rec.entity_type,
      v_rec.entity_id,
      v_rec.before_json,
      v_rec.after_json,
      v_rec.details,
      v_rec.ip_address,
      v_rec.provincial_jurisdiction,
      v_rec.created_at
    );

    UPDATE public.audit_logs
    SET immutable_hash = v_hash
    WHERE id = v_rec.id;

    v_prev := v_hash;
  END LOOP;
END;
$$;

ALTER TABLE public.audit_logs ENABLE TRIGGER trg_audit_logs_immutable;

-- 4. Performance indexes for paginated audit log queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_created_at
  ON public.audit_logs (action, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_jurisdiction_created_at
  ON public.audit_logs (provincial_jurisdiction, created_at DESC);

-- 5. Chain verification RPC for compliance inspection
CREATE OR REPLACE FUNCTION public.verify_audit_log_chain()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_prev text := 'GENESIS:AUTONEXA_CAMP_AUDIT_LEDGER_V1';
  v_expected text;
  v_rec RECORD;
  v_total bigint := 0;
  v_verified bigint := 0;
  v_invalid bigint := 0;
  v_first_broken_id bigint := NULL;
  v_latest_hash text := NULL;
BEGIN
  FOR v_rec IN
    SELECT *
    FROM public.audit_logs
    ORDER BY id ASC
  LOOP
    v_total := v_total + 1;
    v_expected := public.compute_audit_entry_hash(
      v_prev,
      v_rec.id,
      v_rec.actor_name,
      v_rec.actor_role,
      v_rec.action,
      v_rec.entity_type,
      v_rec.entity_id,
      v_rec.before_json,
      v_rec.after_json,
      v_rec.details,
      v_rec.ip_address,
      v_rec.provincial_jurisdiction,
      v_rec.created_at
    );

    IF v_rec.immutable_hash IS NOT DISTINCT FROM v_expected THEN
      v_verified := v_verified + 1;
    ELSE
      v_invalid := v_invalid + 1;
      IF v_first_broken_id IS NULL THEN
        v_first_broken_id := v_rec.id;
      END IF;
    END IF;

    v_latest_hash := v_rec.immutable_hash;
    v_prev := COALESCE(v_rec.immutable_hash, v_expected);
  END LOOP;

  RETURN jsonb_build_object(
    'valid', v_invalid = 0,
    'total_rows', v_total,
    'verified_rows', v_verified,
    'invalid_rows', v_invalid,
    'integrity_percent', CASE
      WHEN v_total = 0 THEN 100.0
      ELSE round((v_verified::numeric / v_total::numeric) * 100, 2)
    END,
    'latest_hash', v_latest_hash,
    'first_broken_id', v_first_broken_id
  );
END;
$$;

-- 6. Admin Analytics SQL Views (security_invoker + restricted to service_role)

CREATE OR REPLACE VIEW public.admin_analytics_settlement_ledger
WITH (security_invoker = true)
AS
SELECT
  m.id,
  m.listing_id,
  m.dealership_id,
  m.seller_id,
  m.voucher_code,
  COALESCE(
    NULLIF(btrim(concat_ws(' ', l.year::text, l.make, l.model, NULLIF(l.trim, ''))), ''),
    'Vehicle Lot'
  ) AS vehicle_title,
  l.vin,
  d.operating_name AS buyer_name,
  d.regulator::text || '-' || d.license_number AS regulator_ref,
  l.province,
  l.city,
  m.agreed_amount_cents,
  COALESCE(m.final_price_cents, m.agreed_amount_cents) AS settlement_amount_cents,
  COALESCE(l.reserve_price_cents, m.agreed_amount_cents) AS reserve_price_cents,
  GREATEST(
    0::bigint,
    COALESCE(m.final_price_cents, m.agreed_amount_cents)
      - COALESCE(l.reserve_price_cents, COALESCE(m.final_price_cents, m.agreed_amount_cents))
  ) AS surplus_cents,
  COALESCE(m.outcome_logged_at, m.updated_at, m.created_at) AS settled_at,
  CASE
    WHEN m.outcome = 'COMPLETED' THEN 'ESCROW_CLEARED'
    ELSE 'SETTLED'
  END AS settlement_status,
  m.outcome::text AS outcome
FROM public.matches m
JOIN public.listings l ON l.id = m.listing_id
JOIN public.dealerships d ON d.id = m.dealership_id
WHERE m.outcome IN ('COMPLETED', 'RENEGOTIATED_LOWER');

CREATE OR REPLACE VIEW public.admin_analytics_provincial_summary
WITH (security_invoker = true)
AS
WITH canonical_provinces(code, province_name, regulator) AS (
  VALUES
    ('ON', 'Ontario', 'OMVIC'),
    ('AB', 'Alberta', 'AMVIC'),
    ('BC', 'British Columbia', 'VSA'),
    ('QC', 'Quebec', 'OPC')
),
dealer_counts AS (
  SELECT
    d.province,
    count(*)::bigint AS verified_dealers_count
  FROM public.dealerships d
  WHERE d.status = 'VERIFIED'
  GROUP BY d.province
),
listing_stats AS (
  SELECT
    l.province,
    count(*)::bigint AS total_listings_count,
    COALESCE(round(avg(l.bid_count)::numeric, 1), 0.0) AS avg_bids_per_listing
  FROM public.listings l
  WHERE l.status IN ('ACTIVE', 'UNSEALED', 'ACCEPTED', 'COMPLETED', 'EXPIRED')
  GROUP BY l.province
),
settlement_stats AS (
  SELECT
    s.province,
    count(*)::bigint AS cleared_lots_count,
    COALESCE(sum(s.settlement_amount_cents), 0)::bigint AS gmv_cents,
    COALESCE(round(avg(s.surplus_cents)), 0)::bigint AS avg_surplus_cents
  FROM public.admin_analytics_settlement_ledger s
  GROUP BY s.province
)
SELECT
  cp.code,
  cp.province_name,
  cp.regulator,
  COALESCE(dc.verified_dealers_count, 0)::bigint AS verified_dealers_count,
  COALESCE(ls.total_listings_count, 0)::bigint AS total_listings_count,
  COALESCE(ss.cleared_lots_count, 0)::bigint AS cleared_lots_count,
  COALESCE(ss.gmv_cents, 0)::bigint AS gmv_cents,
  COALESCE(ss.avg_surplus_cents, 0)::bigint AS avg_surplus_cents,
  COALESCE(ls.avg_bids_per_listing, 0.0)::numeric AS avg_bids_per_listing
FROM canonical_provinces cp
LEFT JOIN dealer_counts dc ON dc.province = cp.code
LEFT JOIN listing_stats ls ON ls.province = cp.code
LEFT JOIN settlement_stats ss ON ss.province = cp.code;

CREATE OR REPLACE VIEW public.admin_analytics_metro_velocity
WITH (security_invoker = true)
AS
WITH listing_base AS (
  SELECT
    l.id,
    COALESCE(NULLIF(btrim(l.city), ''), 'Metro Hub') AS city,
    l.province
  FROM public.listings l
  WHERE l.status IN ('ACTIVE', 'UNSEALED', 'ACCEPTED', 'COMPLETED', 'EXPIRED')
),
settled_listings AS (
  SELECT DISTINCT s.listing_id
  FROM public.admin_analytics_settlement_ledger s
)
SELECT
  lb.city,
  lb.province,
  count(*)::bigint AS intake_lots,
  count(sl.listing_id)::bigint AS cleared_lots,
  CASE
    WHEN count(*) = 0 THEN 0.0
    ELSE round((count(sl.listing_id)::numeric / count(*)::numeric) * 100, 1)
  END AS clearance_percent
FROM listing_base lb
LEFT JOIN settled_listings sl ON sl.listing_id = lb.id
GROUP BY lb.city, lb.province;

CREATE OR REPLACE VIEW public.admin_analytics_dealer_leaderboard
WITH (security_invoker = true)
AS
WITH settled_by_dealer AS (
  SELECT
    s.dealership_id,
    count(*)::bigint AS lots_won,
    COALESCE(sum(s.settlement_amount_cents), 0)::bigint AS volume_cents
  FROM public.admin_analytics_settlement_ledger s
  GROUP BY s.dealership_id
),
bids_by_dealer AS (
  SELECT
    b.dealership_id,
    count(*)::bigint AS total_bids_placed
  FROM public.bids b
  WHERE b.status <> 'VOIDED'
  GROUP BY b.dealership_id
)
SELECT
  d.id AS dealership_id,
  d.operating_name,
  d.legal_name,
  d.regulator::text AS regulator,
  d.license_number,
  d.province,
  d.city,
  COALESCE(sd.lots_won, 0)::bigint AS lots_won,
  COALESCE(sd.volume_cents, 0)::bigint AS volume_cents,
  COALESCE(bd.total_bids_placed, 0)::bigint AS total_bids_placed
FROM public.dealerships d
LEFT JOIN settled_by_dealer sd ON sd.dealership_id = d.id
LEFT JOIN bids_by_dealer bd ON bd.dealership_id = d.id
WHERE d.status = 'VERIFIED'
ORDER BY volume_cents DESC, lots_won DESC, total_bids_placed DESC, d.operating_name ASC;

-- 7. Parameterized Admin Analytics Aggregation RPC (supports 7D / 30D / 90D / YTD & province filter)
CREATE OR REPLACE FUNCTION public.get_admin_platform_analytics(
  p_range text DEFAULT '30D',
  p_province text DEFAULT 'ALL'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_range text := upper(COALESCE(NULLIF(btrim(p_range), ''), '30D'));
  v_province text := upper(COALESCE(NULLIF(btrim(p_province), ''), 'ALL'));
  v_now timestamptz := now();
  v_today date := (now() AT TIME ZONE 'America/Toronto')::date;
  v_start_date date;
  v_window_start timestamptz;
  v_window_end timestamptz;
  v_prev_start timestamptz;
  v_span interval;

  v_total_volume_cents bigint := 0;
  v_prev_volume_cents bigint := 0;
  v_gmv_growth_percent numeric := 0.0;
  v_total_tx_count bigint := 0;
  v_total_listings_count bigint := 0;
  v_eligible_closed_count bigint := 0;
  v_avg_bids_per_lot numeric := 0.0;
  v_avg_surplus_cents bigint := 0;
  v_active_dealers_count bigint := 0;
  v_active_auctions_count bigint := 0;
  v_total_bids_count bigint := 0;
  v_clearance_rate_percent numeric := 0.0;

  v_trend jsonb := '[]'::jsonb;
  v_provincial_share jsonb := '[]'::jsonb;
  v_metro_velocity jsonb := '[]'::jsonb;
  v_leaderboard jsonb := '[]'::jsonb;
  v_settlements jsonb := '[]'::jsonb;
BEGIN
  IF v_range NOT IN ('7D', '30D', '90D', 'YTD') THEN
    v_range := '30D';
  END IF;

  IF v_range = '7D' THEN
    v_start_date := v_today - 6;
  ELSIF v_range = '30D' THEN
    v_start_date := v_today - 29;
  ELSIF v_range = '90D' THEN
    v_start_date := v_today - 90;
  ELSE
    v_start_date := date_trunc('year', v_today::timestamp)::date;
  END IF;

  v_window_start := (v_start_date::timestamp AT TIME ZONE 'America/Toronto');
  v_window_end := GREATEST(v_now, ((v_today + 1)::timestamp AT TIME ZONE 'America/Toronto'));
  v_span := v_window_end - v_window_start;
  v_prev_start := v_window_start - v_span;

  -- KPIs: Current vs previous window settled volume
  SELECT
    COALESCE(sum(s.settlement_amount_cents), 0)::bigint,
    count(*)::bigint,
    COALESCE(round(avg(s.surplus_cents)), 0)::bigint
  INTO v_total_volume_cents, v_total_tx_count, v_avg_surplus_cents
  FROM public.admin_analytics_settlement_ledger s
  WHERE s.settled_at >= v_window_start
    AND s.settled_at <= v_window_end
    AND (v_province = 'ALL' OR s.province = v_province);

  SELECT COALESCE(sum(s.settlement_amount_cents), 0)::bigint
  INTO v_prev_volume_cents
  FROM public.admin_analytics_settlement_ledger s
  WHERE s.settled_at >= v_prev_start
    AND s.settled_at < v_window_start
    AND (v_province = 'ALL' OR s.province = v_province);

  IF v_prev_volume_cents > 0 THEN
    v_gmv_growth_percent := round(
      ((v_total_volume_cents - v_prev_volume_cents)::numeric / v_prev_volume_cents::numeric) * 100,
      1
    );
  ELSIF v_total_volume_cents > 0 THEN
    v_gmv_growth_percent := 100.0;
  ELSE
    v_gmv_growth_percent := 0.0;
  END IF;

  -- KPIs: Listing counts, closed reserve denominator & bidding velocity
  SELECT
    count(*) FILTER (WHERE l.status <> 'DRAFT')::bigint,
    count(*) FILTER (WHERE l.status IN ('UNSEALED', 'ACCEPTED', 'COMPLETED', 'EXPIRED'))::bigint,
    COALESCE(
      round(
        avg(l.bid_count) FILTER (WHERE l.status IN ('ACTIVE', 'UNSEALED', 'ACCEPTED', 'COMPLETED', 'EXPIRED')),
        1
      ),
      0.0
    )
  INTO v_total_listings_count, v_eligible_closed_count, v_avg_bids_per_lot
  FROM public.listings l
  WHERE l.created_at >= v_window_start
    AND l.created_at <= v_window_end
    AND (v_province = 'ALL' OR l.province = v_province);

  v_eligible_closed_count := GREATEST(v_eligible_closed_count, v_total_tx_count);
  IF v_eligible_closed_count > 0 THEN
    v_clearance_rate_percent := round((v_total_tx_count::numeric / v_eligible_closed_count::numeric) * 100, 1);
  ELSE
    v_clearance_rate_percent := 0.0;
  END IF;

  SELECT count(*)::bigint
  INTO v_active_dealers_count
  FROM public.dealerships d
  WHERE d.status = 'VERIFIED'
    AND (v_province = 'ALL' OR d.province = v_province);

  SELECT count(*)::bigint
  INTO v_active_auctions_count
  FROM public.listings l
  WHERE l.status = 'ACTIVE'
    AND (v_province = 'ALL' OR l.province = v_province);

  SELECT count(*)::bigint
  INTO v_total_bids_count
  FROM public.bids b
  JOIN public.listings l ON l.id = b.listing_id
  WHERE b.status <> 'VOIDED'
    AND b.created_at >= v_window_start
    AND b.created_at <= v_window_end
    AND (v_province = 'ALL' OR l.province = v_province);

  -- Time-series spline points across uniform bucket definitions
  WITH raw_buckets AS (
    SELECT
      gs::integer AS idx,
      (v_start_date + gs)::date AS b_start_date,
      (v_start_date + gs + 1)::date AS b_end_date,
      to_char(v_start_date + gs, 'Dy') AS day_label,
      to_char(v_start_date + gs, 'Mon DD') AS date_label
    FROM generate_series(0, 6) AS gs
    WHERE v_range = '7D'
    UNION ALL
    SELECT
      gs::integer AS idx,
      (v_start_date + (gs * 3))::date AS b_start_date,
      LEAST((v_today + 1)::date, (v_start_date + ((gs + 1) * 3))::date) AS b_end_date,
      'B' || (gs + 1)::text AS day_label,
      to_char(v_start_date + (gs * 3), 'Mon DD') AS date_label
    FROM generate_series(0, 9) AS gs
    WHERE v_range = '30D'
    UNION ALL
    SELECT
      gs::integer AS idx,
      (v_start_date + (gs * 7))::date AS b_start_date,
      LEAST((v_today + 1)::date, (v_start_date + ((gs + 1) * 7))::date) AS b_end_date,
      'W' || (gs + 1)::text AS day_label,
      to_char(v_start_date + (gs * 7), 'Mon DD') AS date_label
    FROM generate_series(0, 12) AS gs
    WHERE v_range = '90D'
    UNION ALL
    SELECT
      (row_number() OVER (ORDER BY m_date) - 1)::integer AS idx,
      m_date::date AS b_start_date,
      (m_date + interval '1 month')::date AS b_end_date,
      to_char(m_date, 'Mon') AS day_label,
      to_char(m_date, 'Mon YYYY') AS date_label
    FROM generate_series(
      date_trunc('month', v_start_date::timestamp)::date,
      date_trunc('month', v_today::timestamp)::date,
      interval '1 month'
    ) AS m_date
    WHERE v_range = 'YTD'
  ),
  bucket_bounds AS (
    SELECT
      idx,
      (b_start_date::timestamp AT TIME ZONE 'America/Toronto') AS ts_start,
      (b_end_date::timestamp AT TIME ZONE 'America/Toronto') AS ts_end,
      day_label,
      date_label
    FROM raw_buckets
  ),
  filtered_settled AS (
    SELECT s.settled_at, s.settlement_amount_cents, s.reserve_price_cents
    FROM public.admin_analytics_settlement_ledger s
    WHERE s.settled_at >= v_window_start
      AND s.settled_at <= v_window_end
      AND (v_province = 'ALL' OR s.province = v_province)
  ),
  filtered_bids AS (
    SELECT b.id, b.created_at
    FROM public.bids b
    JOIN public.listings l ON l.id = b.listing_id
    WHERE b.status <> 'VOIDED'
      AND b.created_at >= v_window_start
      AND b.created_at <= v_window_end
      AND (v_province = 'ALL' OR l.province = v_province)
  ),
  settled_agg AS (
    SELECT
      bb.idx,
      COALESCE(sum(fs.settlement_amount_cents), 0)::bigint AS volume_cents,
      COALESCE(sum(fs.reserve_price_cents), 0)::bigint AS reserve_cents,
      count(fs.settled_at)::bigint AS lots_cleared
    FROM bucket_bounds bb
    LEFT JOIN filtered_settled fs
      ON fs.settled_at >= bb.ts_start
     AND fs.settled_at < bb.ts_end
    GROUP BY bb.idx
  ),
  bids_agg AS (
    SELECT
      bb.idx,
      count(fb.id)::bigint AS bids_count
    FROM bucket_bounds bb
    LEFT JOIN filtered_bids fb
      ON fb.created_at >= bb.ts_start
     AND fb.created_at < bb.ts_end
    GROUP BY bb.idx
  )
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'bucketStart', to_char(bb.ts_start AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
        'day', bb.day_label,
        'dateStr', bb.date_label,
        'volumeCents', COALESCE(sa.volume_cents, 0),
        'reserveFloorCents', COALESCE(sa.reserve_cents, 0),
        'bidsCount', COALESCE(ba.bids_count, 0),
        'lotsCleared', COALESCE(sa.lots_cleared, 0)
      )
      ORDER BY bb.idx ASC
    ),
    '[]'::jsonb
  )
  INTO v_trend
  FROM bucket_bounds bb
  LEFT JOIN settled_agg sa ON sa.idx = bb.idx
  LEFT JOIN bids_agg ba ON ba.idx = bb.idx;

  -- Provincial Market Share (canonical ON/AB/BC/QC plus any other province with settled volume > 0)
  WITH canonical(code, province_name, regulator, sort_rank) AS (
    VALUES
      ('ON', 'Ontario', 'OMVIC', 1),
      ('AB', 'Alberta', 'AMVIC', 2),
      ('BC', 'British Columbia', 'VSA', 3),
      ('QC', 'Quebec', 'OPC', 4)
  ),
  dealers_by_prov AS (
    SELECT d.province, count(*)::bigint AS dealers_count
    FROM public.dealerships d
    WHERE d.status = 'VERIFIED'
    GROUP BY d.province
  ),
  lots_by_prov AS (
    SELECT l.province, count(*)::bigint AS lots_count
    FROM public.listings l
    WHERE l.status <> 'DRAFT'
      AND l.created_at >= v_window_start
      AND l.created_at <= v_window_end
    GROUP BY l.province
  ),
  settled_by_prov AS (
    SELECT
      s.province,
      count(*)::bigint AS cleared_lots_count,
      COALESCE(sum(s.settlement_amount_cents), 0)::bigint AS volume_cents,
      COALESCE(round(avg(s.surplus_cents)), 0)::bigint AS avg_surplus_cents
    FROM public.admin_analytics_settlement_ledger s
    WHERE s.settled_at >= v_window_start
      AND s.settled_at <= v_window_end
    GROUP BY s.province
  ),
  extra_provs AS (
    SELECT
      sp.province AS code,
      sp.province AS province_name,
      'OMVIC'::text AS regulator,
      99 AS sort_rank
    FROM settled_by_prov sp
    WHERE sp.volume_cents > 0
      AND sp.province NOT IN ('ON', 'AB', 'BC', 'QC')
  ),
  all_provs AS (
    SELECT * FROM canonical
    UNION ALL
    SELECT * FROM extra_provs
  ),
  combined_prov AS (
    SELECT
      ap.code,
      ap.province_name,
      ap.regulator,
      ap.sort_rank,
      COALESCE(sp.volume_cents, 0)::bigint AS volume_cents,
      COALESCE(dp.dealers_count, 0)::bigint AS dealers_count,
      COALESCE(lp.lots_count, 0)::bigint AS lots_count,
      COALESCE(sp.cleared_lots_count, 0)::bigint AS cleared_lots_count,
      COALESCE(sp.avg_surplus_cents, 0)::bigint AS avg_surplus_cents
    FROM all_provs ap
    LEFT JOIN dealers_by_prov dp ON dp.province = ap.code
    LEFT JOIN lots_by_prov lp ON lp.province = ap.code
    LEFT JOIN settled_by_prov sp ON sp.province = ap.code
  ),
  totals AS (
    SELECT GREATEST(0, COALESCE(sum(cp.volume_cents), 0))::numeric AS all_prov_volume
    FROM combined_prov cp
  )
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'province', cp.province_name,
        'code', cp.code,
        'regulator', cp.regulator,
        'volumeCents', cp.volume_cents,
        'sharePercent', CASE
          WHEN t.all_prov_volume > 0 THEN round((cp.volume_cents::numeric / t.all_prov_volume) * 100, 1)
          ELSE 0.0
        END,
        'dealersCount', cp.dealers_count,
        'lotsCount', cp.lots_count,
        'clearedLotsCount', cp.cleared_lots_count,
        'avgSurplusCents', cp.avg_surplus_cents
      )
      ORDER BY cp.sort_rank ASC, cp.code ASC
    ),
    '[]'::jsonb
  )
  INTO v_provincial_share
  FROM combined_prov cp
  CROSS JOIN totals t
  WHERE v_province = 'ALL' OR cp.code = v_province;

  -- Metropolitan Intake & Clearance Velocity (Top 7 metro hubs in window)
  WITH metro_rows AS (
    SELECT
      COALESCE(NULLIF(btrim(l.city), ''), 'Metro Hub') AS city,
      l.province AS province_code,
      count(*)::bigint AS intake_lots,
      count(s.id)::bigint AS cleared_lots
    FROM public.listings l
    LEFT JOIN public.admin_analytics_settlement_ledger s
      ON s.listing_id = l.id
     AND s.settled_at >= v_window_start
     AND s.settled_at <= v_window_end
    WHERE l.status IN ('ACTIVE', 'UNSEALED', 'ACCEPTED', 'COMPLETED', 'EXPIRED')
      AND l.created_at >= v_window_start
      AND l.created_at <= v_window_end
      AND (v_province = 'ALL' OR l.province = v_province)
    GROUP BY COALESCE(NULLIF(btrim(l.city), ''), 'Metro Hub'), l.province
    ORDER BY count(*) DESC, count(s.id) DESC, city ASC
    LIMIT 7
  )
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'city', mr.city,
        'provinceCode', mr.province_code,
        'intakeLots', mr.intake_lots,
        'clearedLots', mr.cleared_lots,
        'clearancePercent', CASE
          WHEN mr.intake_lots = 0 THEN 0.0
          ELSE round((mr.cleared_lots::numeric / mr.intake_lots::numeric) * 100, 1)
        END
      )
      ORDER BY mr.intake_lots DESC, mr.cleared_lots DESC, mr.city ASC
    ),
    '[]'::jsonb
  )
  INTO v_metro_velocity
  FROM metro_rows mr;

  -- Top Sourcing Dealerships Leaderboard (Top 5 verified dealerships in window)
  WITH cur_sales AS (
    SELECT
      s.dealership_id,
      count(*)::bigint AS lots_won,
      COALESCE(sum(s.settlement_amount_cents), 0)::bigint AS volume_cents
    FROM public.admin_analytics_settlement_ledger s
    WHERE s.settled_at >= v_window_start
      AND s.settled_at <= v_window_end
    GROUP BY s.dealership_id
  ),
  prev_sales AS (
    SELECT
      s.dealership_id,
      COALESCE(sum(s.settlement_amount_cents), 0)::bigint AS prev_volume_cents
    FROM public.admin_analytics_settlement_ledger s
    WHERE s.settled_at >= v_prev_start
      AND s.settled_at < v_window_start
    GROUP BY s.dealership_id
  ),
  cur_bids AS (
    SELECT
      b.dealership_id,
      count(*)::bigint AS bids_placed
    FROM public.bids b
    JOIN public.listings l ON l.id = b.listing_id
    WHERE b.status <> 'VOIDED'
      AND b.created_at >= v_window_start
      AND b.created_at <= v_window_end
      AND (v_province = 'ALL' OR l.province = v_province)
    GROUP BY b.dealership_id
  ),
  ranked AS (
    SELECT
      row_number() OVER (
        ORDER BY COALESCE(cs.volume_cents, 0) DESC,
                 COALESCE(cs.lots_won, 0) DESC,
                 COALESCE(cb.bids_placed, 0) DESC,
                 d.operating_name ASC
      )::integer AS dealer_rank,
      d.id AS dealership_id,
      d.operating_name,
      d.legal_name,
      d.regulator::text AS regulator,
      d.license_number,
      d.province,
      COALESCE(cs.lots_won, 0)::bigint AS lots_won,
      COALESCE(cb.bids_placed, 0)::bigint AS bids_placed,
      COALESCE(cs.volume_cents, 0)::bigint AS volume_cents,
      CASE
        WHEN COALESCE(ps.prev_volume_cents, 0) > 0 THEN round(
          ((COALESCE(cs.volume_cents, 0) - ps.prev_volume_cents)::numeric / ps.prev_volume_cents::numeric) * 100,
          1
        )
        WHEN COALESCE(cs.volume_cents, 0) > 0 THEN 100.0
        ELSE 0.0
      END AS growth_percent
    FROM public.dealerships d
    LEFT JOIN cur_sales cs ON cs.dealership_id = d.id
    LEFT JOIN prev_sales ps ON ps.dealership_id = d.id
    LEFT JOIN cur_bids cb ON cb.dealership_id = d.id
    WHERE d.status = 'VERIFIED'
      AND (v_province = 'ALL' OR d.province = v_province)
    ORDER BY COALESCE(cs.volume_cents, 0) DESC,
             COALESCE(cs.lots_won, 0) DESC,
             COALESCE(cb.bids_placed, 0) DESC,
             d.operating_name ASC
    LIMIT 5
  )
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'rank', r.dealer_rank,
        'dealershipId', r.dealership_id,
        'name', r.operating_name,
        'entity', r.legal_name,
        'regulator', r.regulator,
        'licenseNumber', r.license_number,
        'province', r.province,
        'lotsWon', r.lots_won,
        'bidsPlaced', r.bids_placed,
        'volumeCents', r.volume_cents,
        'growthPercent', r.growth_percent,
        'monogram', upper(
          left(regexp_replace(split_part(r.operating_name, ' ', 1), '[^A-Za-z0-9]', '', 'g'), 1)
          || COALESCE(
            NULLIF(left(regexp_replace(split_part(r.operating_name, ' ', 2), '[^A-Za-z0-9]', '', 'g'), 1), ''),
            substring(regexp_replace(r.operating_name, '[^A-Za-z0-9]', '', 'g') FROM 2 FOR 1)
          )
        )
      )
      ORDER BY r.dealer_rank ASC
    ),
    '[]'::jsonb
  )
  INTO v_leaderboard
  FROM ranked r;

  -- Latest 50 Wholesale Settlements
  WITH latest_settlements AS (
    SELECT *
    FROM public.admin_analytics_settlement_ledger s
    WHERE s.settled_at >= v_window_start
      AND s.settled_at <= v_window_end
      AND (v_province = 'ALL' OR s.province = v_province)
    ORDER BY s.settled_at DESC
    LIMIT 50
  )
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', ls.id,
        'listingId', ls.listing_id,
        'voucherCode', ls.voucher_code,
        'vehicle', ls.vehicle_title,
        'vin', ls.vin,
        'buyer', ls.buyer_name,
        'regulator', ls.regulator_ref,
        'province', ls.province,
        'amountCents', ls.settlement_amount_cents,
        'surplusCents', ls.surplus_cents,
        'completedAtIso', to_char(ls.settled_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
        'status', ls.settlement_status,
        'outcome', ls.outcome
      )
      ORDER BY ls.settled_at DESC
    ),
    '[]'::jsonb
  )
  INTO v_settlements
  FROM latest_settlements ls;

  RETURN jsonb_build_object(
    'range', v_range,
    'province', v_province,
    'kpis', jsonb_build_object(
      'totalVolumeCents', v_total_volume_cents,
      'previousVolumeCents', v_prev_volume_cents,
      'gmvGrowthPercent', v_gmv_growth_percent,
      'totalTransactionsCount', v_total_tx_count,
      'totalListingsCount', v_total_listings_count,
      'eligibleClosedListingsCount', v_eligible_closed_count,
      'clearedLotsCount', v_total_tx_count,
      'clearanceRatePercent', v_clearance_rate_percent,
      'averageBidsPerLot', v_avg_bids_per_lot,
      'averageSellerSurplusCents', v_avg_surplus_cents,
      'activeDealerCount', v_active_dealers_count,
      'activeAuctionsCount', v_active_auctions_count,
      'totalBidsCount', v_total_bids_count
    ),
    'trend', v_trend,
    'provincialShare', v_provincial_share,
    'metroVelocity', v_metro_velocity,
    'dealerLeaderboard', v_leaderboard,
    'settlements', v_settlements
  );
END;
$$;

-- 8. Least-privilege permissions on analytics views, RPCs, and audit chain functions
REVOKE ALL ON public.admin_analytics_settlement_ledger FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.admin_analytics_provincial_summary FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.admin_analytics_metro_velocity FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.admin_analytics_dealer_leaderboard FROM PUBLIC, anon, authenticated;

GRANT SELECT ON public.admin_analytics_settlement_ledger TO service_role;
GRANT SELECT ON public.admin_analytics_provincial_summary TO service_role;
GRANT SELECT ON public.admin_analytics_metro_velocity TO service_role;
GRANT SELECT ON public.admin_analytics_dealer_leaderboard TO service_role;

REVOKE ALL ON FUNCTION public.compute_audit_entry_hash(
  text, bigint, text, text, text, text, text, jsonb, jsonb, text, text, text, timestamptz
) FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.set_audit_log_hash() FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.verify_audit_log_chain() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_audit_log_chain() TO service_role;

REVOKE ALL ON FUNCTION public.get_admin_platform_analytics(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_platform_analytics(text, text) TO service_role;
