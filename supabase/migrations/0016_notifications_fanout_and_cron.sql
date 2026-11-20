-- ============================================================================
-- Migration 0016: PostGIS Dealer Radius Notification Fan-Out RPC,
--                 Bilingual pg_cron Notification Triggers & Inbox RLS Index
-- Implements Prompt B7.3 (FR-DL-05, FR-X-01, H10, AC-06, CASL)
-- ============================================================================

-- 1. PostGIS Radius Query for Verified & Subscribed Dealership Staff
-- Strictly restricted to `service_role` (never exposed directly to clients).
CREATE OR REPLACE FUNCTION public.get_eligible_dealerships_within_radius(
  p_listing_id uuid
)
RETURNS TABLE (
  dealership_id uuid,
  operating_name text,
  distance_km integer,
  effective_radius_km integer,
  user_id uuid,
  email text,
  phone_e164 text,
  language_pref text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    d.id AS dealership_id,
    d.operating_name,
    GREATEST(
      1,
      ROUND((extensions.ST_Distance(l.location, d.location) / 1000.0)::numeric)::integer
    ) AS distance_km,
    LEAST(d.service_radius_km, pl.max_radius_km)::integer AS effective_radius_km,
    pr.id AS user_id,
    pr.email,
    pr.phone_e164,
    pr.language_pref
  FROM public.listings l
  JOIN public.dealerships d
    ON d.status = 'VERIFIED'
   AND d.location IS NOT NULL
  JOIN public.subscriptions s
    ON s.dealership_id = d.id
   AND s.status IN ('ACTIVE', 'TRIALING')
   AND s.current_period_end > now()
  JOIN public.plans pl
    ON pl.id = s.plan_id
  JOIN (
    SELECT dm.dealership_id, dm.user_id
    FROM public.dealership_members dm
    WHERE dm.is_active = true
    UNION
    SELECT p.dealership_id, p.id AS user_id
    FROM public.profiles p
    WHERE p.dealership_id IS NOT NULL
      AND p.role IN ('DEALER_ADMIN', 'DEALER_AGENT')
  ) staff
    ON staff.dealership_id = d.id
  JOIN public.profiles pr
    ON pr.id = staff.user_id
   AND pr.account_status = 'ACTIVE'
  WHERE l.id = p_listing_id
    AND l.location IS NOT NULL
    AND extensions.ST_DWithin(
      l.location,
      d.location,
      LEAST(d.service_radius_km, pl.max_radius_km)::double precision * 1000.0
    )
  ORDER BY distance_km ASC, d.id ASC, pr.id ASC;
$$;

REVOKE ALL ON FUNCTION public.get_eligible_dealerships_within_radius(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_eligible_dealerships_within_radius(uuid) TO service_role;

-- 2. Upgrade pg_cron Sweep: Close Expired Auctions + Persist Bilingual Notifications
CREATE OR REPLACE FUNCTION private.close_expired_auctions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_closed_count integer := 0;
  v_row RECORD;
  v_dealer_user RECORD;
  v_now timestamptz := now();
  v_seller_lang text;
  v_notif_id uuid;
  v_title text;
  v_desc text;
  v_vehicle_label text;
BEGIN
  FOR v_row IN
    UPDATE public.listings
    SET
      status = 'UNSEALED',
      closed_at = v_now
    WHERE status = 'ACTIVE'
      AND auction_ends_at IS NOT NULL
      AND auction_ends_at <= v_now
    RETURNING id, seller_id, year, make, model, province, bid_count
  LOOP
    v_closed_count := v_closed_count + 1;
    v_vehicle_label := format('%s %s %s', v_row.year, v_row.make, v_row.model);

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

    SELECT COALESCE(p.language_pref, 'en')
    INTO v_seller_lang
    FROM public.profiles p
    WHERE p.id = v_row.seller_id;

    IF v_seller_lang = 'fr' THEN
      v_title := format('Enchères dévoilées — %s', v_vehicle_label);
      v_desc := CASE
        WHEN v_row.bid_count > 0 THEN format('%s offre(s) de concessionnaires vérifiés sont maintenant dévoilées pour sélection.', v_row.bid_count)
        ELSE 'La fenêtre d''enchères de 24h s''est terminée sans offre reçue.'
      END;
    ELSE
      v_title := format('Bids unsealed — %s', v_vehicle_label);
      v_desc := CASE
        WHEN v_row.bid_count > 0 THEN format('%s verified dealership offer(s) are now unsealed and ready for your selection.', v_row.bid_count)
        ELSE 'Your 24-hour auction window closed without dealer offers.'
      END;
    END IF;

    INSERT INTO public.notifications (
      user_id, type, title, description, listing_id, metadata
    )
    VALUES (
      v_row.seller_id,
      'AUCTION',
      v_title,
      v_desc,
      v_row.id,
      jsonb_build_object(
        'event', 'AUCTION_CLOSED',
        'bidCount', v_row.bid_count,
        'actionUrl', format('/seller/listings/%s', v_row.id)
      )
    )
    RETURNING id INTO v_notif_id;

    INSERT INTO public.notification_deliveries (
      notification_id, user_id, channel, provider, status
    )
    VALUES (
      v_notif_id, v_row.seller_id, 'IN_APP', 'pg_cron', 'SENT'
    );

    -- Notify active staff of participating dealerships without exposing bid amounts
    FOR v_dealer_user IN
      SELECT DISTINCT staff.user_id, COALESCE(pr.language_pref, 'en') AS language_pref
      FROM public.bids b
      JOIN (
        SELECT dm.dealership_id, dm.user_id
        FROM public.dealership_members dm
        WHERE dm.is_active = true
        UNION
        SELECT p.dealership_id, p.id AS user_id
        FROM public.profiles p
        WHERE p.dealership_id IS NOT NULL
          AND p.role IN ('DEALER_ADMIN', 'DEALER_AGENT')
      ) staff ON staff.dealership_id = b.dealership_id
      JOIN public.profiles pr ON pr.id = staff.user_id AND pr.account_status = 'ACTIVE'
      WHERE b.listing_id = v_row.id
        AND b.status <> 'VOIDED'
    LOOP
      IF v_dealer_user.language_pref = 'fr' THEN
        v_title := format('Enchère fermée — %s', v_vehicle_label);
        v_desc := 'La fenêtre d''enchères est terminée. Les offres ont été dévoilées au vendeur pour sélection.';
      ELSE
        v_title := format('Auction closed — %s', v_vehicle_label);
        v_desc := 'Bidding has closed on this vehicle. Offers have been unsealed for seller review.';
      END IF;

      INSERT INTO public.notifications (
        user_id, type, title, description, listing_id, metadata
      )
      VALUES (
        v_dealer_user.user_id,
        'AUCTION',
        v_title,
        v_desc,
        v_row.id,
        jsonb_build_object(
          'event', 'AUCTION_CLOSED',
          'actionUrl', '/dealer/active-bids'
        )
      )
      RETURNING id INTO v_notif_id;

      INSERT INTO public.notification_deliveries (
        notification_id, user_id, channel, provider, status
      )
      VALUES (
        v_notif_id, v_dealer_user.user_id, 'IN_APP', 'pg_cron', 'SENT'
      );
    END LOOP;
  END LOOP;

  RETURN v_closed_count;
END;
$$;

-- 3. Upgrade pg_cron Sweep: Expire Overdue Matches + Persist Bilingual Notifications
CREATE OR REPLACE FUNCTION private.expire_overdue_matches()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_expired_count integer := 0;
  v_row RECORD;
  v_dealer_user RECORD;
  v_now timestamptz := now();
  v_seller_lang text;
  v_vehicle_label text;
  v_notif_id uuid;
  v_title text;
  v_desc text;
BEGIN
  FOR v_row IN
    UPDATE public.matches
    SET
      outcome = 'EXPIRED',
      outcome_logged_at = v_now,
      outcome_notes = COALESCE(outcome_notes, '24-hour seller acceptance appointment window expired without recorded visit.')
    WHERE outcome = 'APPOINTMENT_CONFIRMED'
      AND accept_expires_at <= v_now
    RETURNING id, listing_id, dealership_id, seller_id, voucher_code
  LOOP
    v_expired_count := v_expired_count + 1;

    UPDATE public.listings
    SET status = 'UNSEALED'
    WHERE id = v_row.listing_id
      AND status = 'ACCEPTED';

    SELECT format('%s %s %s', l.year, l.make, l.model)
    INTO v_vehicle_label
    FROM public.listings l
    WHERE l.id = v_row.listing_id;

    v_vehicle_label := COALESCE(v_vehicle_label, 'Vehicle listing');

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

    SELECT COALESCE(p.language_pref, 'en')
    INTO v_seller_lang
    FROM public.profiles p
    WHERE p.id = v_row.seller_id;

    IF v_seller_lang = 'fr' THEN
      v_title := format('Fenêtre de rendez-vous expirée — %s', v_vehicle_label);
      v_desc := format('Le bon %s a expiré après 24 heures. Vous pouvez sélectionner une autre offre ou remettre le véhicule en ligne.', v_row.voucher_code);
    ELSE
      v_title := format('Acceptance window expired — %s', v_vehicle_label);
      v_desc := format('Handover voucher %s expired after 24 hours. Your listing has returned to unsealed review to select another dealer.', v_row.voucher_code);
    END IF;

    INSERT INTO public.notifications (
      user_id, type, title, description, listing_id, metadata
    )
    VALUES (
      v_row.seller_id,
      'MATCH',
      v_title,
      v_desc,
      v_row.listing_id,
      jsonb_build_object(
        'event', 'MATCH_ACCEPTANCE_EXPIRED',
        'matchId', v_row.id,
        'voucherCode', v_row.voucher_code,
        'actionUrl', format('/seller/listings/%s', v_row.listing_id)
      )
    )
    RETURNING id INTO v_notif_id;

    INSERT INTO public.notification_deliveries (
      notification_id, user_id, channel, provider, status
    )
    VALUES (
      v_notif_id, v_row.seller_id, 'IN_APP', 'pg_cron', 'SENT'
    );

    FOR v_dealer_user IN
      SELECT DISTINCT staff.user_id, COALESCE(pr.language_pref, 'en') AS language_pref
      FROM (
        SELECT dm.dealership_id, dm.user_id
        FROM public.dealership_members dm
        WHERE dm.dealership_id = v_row.dealership_id
          AND dm.is_active = true
        UNION
        SELECT p.dealership_id, p.id AS user_id
        FROM public.profiles p
        WHERE p.dealership_id = v_row.dealership_id
          AND p.role IN ('DEALER_ADMIN', 'DEALER_AGENT')
      ) staff
      JOIN public.profiles pr ON pr.id = staff.user_id AND pr.account_status = 'ACTIVE'
    LOOP
      IF v_dealer_user.language_pref = 'fr' THEN
        v_title := format('Rendez-vous expiré — %s', v_vehicle_label);
        v_desc := format('La fenêtre d''acceptation de 24 heures pour le bon %s est expirée.', v_row.voucher_code);
      ELSE
        v_title := format('Handover appointment expired — %s', v_vehicle_label);
        v_desc := format('The 24-hour acceptance window for voucher %s has elapsed without completed handover.', v_row.voucher_code);
      END IF;

      INSERT INTO public.notifications (
        user_id, type, title, description, listing_id, metadata
      )
      VALUES (
        v_dealer_user.user_id,
        'MATCH',
        v_title,
        v_desc,
        v_row.listing_id,
        jsonb_build_object(
          'event', 'MATCH_ACCEPTANCE_EXPIRED',
          'matchId', v_row.id,
          'voucherCode', v_row.voucher_code,
          'actionUrl', '/dealer/won-matches'
        )
      )
      RETURNING id INTO v_notif_id;

      INSERT INTO public.notification_deliveries (
        notification_id, user_id, channel, provider, status
      )
      VALUES (
        v_notif_id, v_dealer_user.user_id, 'IN_APP', 'pg_cron', 'SENT'
      );
    END LOOP;
  END LOOP;

  RETURN v_expired_count;
END;
$$;

REVOKE ALL ON FUNCTION private.close_expired_auctions() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.close_expired_auctions() TO postgres, service_role;

REVOKE ALL ON FUNCTION private.expire_overdue_matches() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.expire_overdue_matches() TO postgres, service_role;

-- 4. Inbox Performance Index & User Delete RLS Policy
CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created
  ON public.notifications (user_id, read, created_at DESC);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'notifications'
      AND policyname = 'notifications_delete'
  ) THEN
    CREATE POLICY notifications_delete ON public.notifications
      FOR DELETE TO authenticated
      USING (user_id = (SELECT auth.uid()) OR (SELECT private.is_admin()));
  END IF;
END $$;
