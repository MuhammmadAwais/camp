-- ============================================================================
-- Migration 0002: Core Relational Schema (22 Normalized Tables)
-- Strict BIGINT integer CAD cents invariant (NFR-14)
-- Default-deny RLS enabled on every public table (policies added in 0004)
-- ============================================================================

-- 1. Platform Configuration (FR-AD-08)
CREATE TABLE IF NOT EXISTS public.platform_config (
  key text PRIMARY KEY,
  value_json jsonb NOT NULL,
  description text,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. User Profiles (1:1 with auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  first_name text NOT NULL DEFAULT '',
  last_name text NOT NULL DEFAULT '',
  phone_e164 text,
  postal_code text,
  province text,
  city text,
  location extensions.geography(Point, 4326),
  role public.user_role NOT NULL DEFAULT 'SELLER',
  kyc_status public.kyc_status NOT NULL DEFAULT 'NOT_STARTED',
  dealership_id uuid,
  language_pref text NOT NULL DEFAULT 'en' CHECK (language_pref IN ('en', 'fr')),
  email_verified boolean NOT NULL DEFAULT false,
  phone_verified boolean NOT NULL DEFAULT false,
  marketing_opt_in boolean NOT NULL DEFAULT false,
  mfa_enabled boolean NOT NULL DEFAULT false,
  avatar_url text,
  job_title text,
  regulator_board_id text,
  account_status text NOT NULL DEFAULT 'ACTIVE' CHECK (account_status IN ('ACTIVE', 'SUSPENDED', 'PENDING_DELETION', 'DELETED')),
  deletion_requested_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. PIPEDA / Law 25 / CASL Consent Ledger (NFR-08)
CREATE TABLE IF NOT EXISTS public.user_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  consent_type text NOT NULL CHECK (consent_type IN ('PIPEDA_PRIVACY', 'LAW25_PRIVACY', 'TERMS_OF_SERVICE', 'CASL_MARKETING', 'KYC_BIOMETRIC')),
  granted boolean NOT NULL,
  policy_version text NOT NULL DEFAULT '1.0',
  ip_address text,
  user_agent text,
  recorded_at timestamptz NOT NULL DEFAULT now()
);

-- 4. KYC Verification Submissions (FR-EU-02)
CREATE TABLE IF NOT EXISTS public.kyc_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'sandbox',
  provider_ref text,
  id_doc_type public.id_doc_type NOT NULL,
  doc_storage_path text,
  selfie_storage_path text,
  status public.kyc_status NOT NULL DEFAULT 'PENDING',
  reject_reason text,
  reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  verified_at timestamptz,
  expires_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Licensed Dealerships (FR-DL-01, FR-DL-02)
CREATE TABLE IF NOT EXISTS public.dealerships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operating_name text NOT NULL,
  legal_name text NOT NULL,
  business_number text,
  regulator public.regulator_code NOT NULL,
  license_number text NOT NULL,
  license_expiry date,
  license_doc_path text,
  status public.dealership_status NOT NULL DEFAULT 'PENDING',
  street_address text NOT NULL,
  city text NOT NULL,
  province text NOT NULL,
  postal_code text NOT NULL,
  location extensions.geography(Point, 4326),
  service_radius_km integer NOT NULL DEFAULT 100 CHECK (service_radius_km BETWEEN 10 AND 1000),
  contact_name text NOT NULL,
  contact_title text,
  contact_email text NOT NULL,
  contact_phone text NOT NULL,
  operating_hours text NOT NULL DEFAULT 'Monday - Saturday: 9:00 AM - 6:00 PM',
  rating numeric(3,2) NOT NULL DEFAULT 5.00 CHECK (rating >= 0 AND rating <= 5),
  review_count integer NOT NULL DEFAULT 0 CHECK (review_count >= 0),
  payout_speed_days integer NOT NULL DEFAULT 1 CHECK (payout_speed_days >= 0),
  certified_pre_inspection boolean NOT NULL DEFAULT false,
  verification_notes text,
  verified_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (regulator, license_number)
);

-- Wire profiles.dealership_id FK cleanly after dealerships exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_dealership_id_fkey'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_dealership_id_fkey
      FOREIGN KEY (dealership_id) REFERENCES public.dealerships(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 6. Dealership Staff Seats (FR-DL-04 + DealerTeamView)
CREATE TABLE IF NOT EXISTS public.dealership_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dealership_id uuid NOT NULL REFERENCES public.dealerships(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  seat_role public.dealer_seat_role NOT NULL DEFAULT 'DEALER_BUYER',
  invited_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  last_active_at timestamptz,
  joined_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (dealership_id, user_id)
);

-- 7. Subscription Plans (FR-DL-03, NFR-14 integer CAD cents)
CREATE TABLE IF NOT EXISTS public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  billing_interval text NOT NULL CHECK (billing_interval IN ('month', 'year')),
  price_cents bigint NOT NULL CHECK (price_cents >= 0),
  currency text NOT NULL DEFAULT 'CAD' CHECK (currency = 'CAD'),
  monthly_bid_quota integer NOT NULL CHECK (monthly_bid_quota > 0),
  max_radius_km integer NOT NULL CHECK (max_radius_km > 0),
  max_team_seats integer NOT NULL DEFAULT 3 CHECK (max_team_seats > 0),
  stripe_price_id text,
  features_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 8. Dealership Active Subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dealership_id uuid NOT NULL UNIQUE REFERENCES public.dealerships(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.plans(id) ON DELETE RESTRICT,
  status public.subscription_status NOT NULL DEFAULT 'ACTIVE',
  stripe_customer_id text,
  stripe_subscription_id text UNIQUE,
  current_period_start timestamptz NOT NULL DEFAULT now(),
  current_period_end timestamptz NOT NULL,
  bids_used integer NOT NULL DEFAULT 0 CHECK (bids_used >= 0),
  auto_renew boolean NOT NULL DEFAULT true,
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 9. Subscription Payment Invoices
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  dealership_id uuid NOT NULL REFERENCES public.dealerships(id) ON DELETE CASCADE,
  invoice_number text NOT NULL UNIQUE,
  amount_cents bigint NOT NULL CHECK (amount_cents >= 0),
  currency text NOT NULL DEFAULT 'CAD' CHECK (currency = 'CAD'),
  status text NOT NULL CHECK (status IN ('PAID', 'FAILED', 'REFUNDED', 'OPEN')),
  description text NOT NULL,
  stripe_invoice_id text UNIQUE,
  stripe_payment_intent_id text,
  invoice_pdf_url text,
  paid_at timestamptz,
  refunded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 10. Stripe Webhook Deduplication Log (H9)
CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  event_id text PRIMARY KEY,
  event_type text NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now(),
  payload_summary jsonb
);

-- 11. Canadian Postal FSA Centroids (FR-X-03, H6)
CREATE TABLE IF NOT EXISTS public.postal_centroids (
  postal_prefix text PRIMARY KEY CHECK (char_length(postal_prefix) = 3),
  city text NOT NULL,
  province text NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  location extensions.geography(Point, 4326) NOT NULL
);

-- 12. VIN Decode Cache (FR-EU-03, SRS §7.4)
CREATE TABLE IF NOT EXISTS public.vin_decode_cache (
  vin text PRIMARY KEY CHECK (char_length(vin) = 17),
  year integer,
  make text,
  model text,
  trim text,
  body_style text,
  engine_spec text,
  transmission text,
  drivetrain text,
  fuel_type text,
  raw_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  provider text NOT NULL DEFAULT 'nhtsa_vpic',
  cached_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days')
);

-- 13. Vehicle Auction Listings (FR-EU-04, FR-EU-07, FR-EU-13)
CREATE TABLE IF NOT EXISTS public.listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  vin text NOT NULL CHECK (char_length(vin) = 17),
  year integer NOT NULL CHECK (year BETWEEN 1980 AND 2035),
  make text NOT NULL,
  model text NOT NULL,
  trim text NOT NULL DEFAULT '',
  body_type text,
  engine_spec text,
  horsepower integer CHECK (horsepower IS NULL OR horsepower > 0),
  fuel_type text,
  mileage_km integer NOT NULL CHECK (mileage_km >= 0 AND mileage_km <= 2000000),
  transmission text,
  drivetrain text,
  exterior_color text,
  interior_color text,
  keys_count integer NOT NULL DEFAULT 2 CHECK (keys_count BETWEEN 1 AND 10),
  accident_declaration boolean NOT NULL DEFAULT false,
  accident_count integer NOT NULL DEFAULT 0 CHECK (accident_count >= 0),
  accident_details text,
  has_lien boolean NOT NULL DEFAULT false,
  lien_details text,
  service_history_notes text,
  tire_condition text,
  seller_notes text,
  vin_decoded_json jsonb,
  manual_edits_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  carfax_clean boolean NOT NULL DEFAULT true,
  carfax_summary_json jsonb,
  damage_grade text NOT NULL DEFAULT 'A' CHECK (damage_grade IN ('A', 'B', 'C', 'D')),
  damage_hotspot_count integer NOT NULL DEFAULT 0 CHECK (damage_hotspot_count >= 0),
  postal_code text NOT NULL,
  city text NOT NULL DEFAULT '',
  province text NOT NULL,
  location extensions.geography(Point, 4326),
  reserve_price_cents bigint CHECK (reserve_price_cents IS NULL OR reserve_price_cents >= 0),
  status public.listing_status NOT NULL DEFAULT 'PENDING_MODERATION',
  bid_count integer NOT NULL DEFAULT 0 CHECK (bid_count >= 0),
  declaration_owner_attested boolean NOT NULL DEFAULT false,
  declaration_accurate_condition boolean NOT NULL DEFAULT false,
  declaration_no_unpaid_fines boolean NOT NULL DEFAULT false,
  moderation_notes text,
  moderated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  moderated_at timestamptz,
  auction_started_at timestamptz,
  auction_ends_at timestamptz,
  closed_at timestamptz,
  relist_count integer NOT NULL DEFAULT 0 CHECK (relist_count >= 0),
  parent_listing_id uuid REFERENCES public.listings(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 14. Listing Media Objects (FR-EU-05)
CREATE TABLE IF NOT EXISTS public.listing_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  storage_key text NOT NULL,
  public_url text NOT NULL,
  file_name text NOT NULL,
  file_size_bytes bigint CHECK (file_size_bytes IS NULL OR file_size_bytes > 0),
  mime_type text,
  photo_label text,
  is_cover boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 15. Listing Damage Hotspots (FR-EU-06)
CREATE TABLE IF NOT EXISTS public.damage_hotspots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  viewpoint text NOT NULL,
  x_percent numeric(5,2) NOT NULL CHECK (x_percent >= 0 AND x_percent <= 100),
  y_percent numeric(5,2) NOT NULL CHECK (y_percent >= 0 AND y_percent <= 100),
  panel text NOT NULL,
  severity public.damage_severity NOT NULL,
  description text,
  photo_storage_key text,
  photo_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 16. Sealed Dealership Bids (BR-04, BR-05, NFR-14, NFR-15)
CREATE TABLE IF NOT EXISTS public.bids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  dealership_id uuid NOT NULL REFERENCES public.dealerships(id) ON DELETE RESTRICT,
  placed_by_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  amount_cents bigint NOT NULL CHECK (amount_cents > 0),
  conditions text,
  notes text,
  status public.bid_status NOT NULL DEFAULT 'ACTIVE',
  version integer NOT NULL DEFAULT 1 CHECK (version >= 1),
  revision_count integer NOT NULL DEFAULT 0 CHECK (revision_count >= 0),
  idempotency_key text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  revised_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (listing_id, dealership_id)
);

-- 17. Post-Auction Seller-Dealer Matches & Vouchers (FR-EU-10, FR-DL-10)
CREATE TABLE IF NOT EXISTS public.matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL UNIQUE REFERENCES public.listings(id) ON DELETE RESTRICT,
  winning_bid_id uuid NOT NULL UNIQUE REFERENCES public.bids(id) ON DELETE RESTRICT,
  dealership_id uuid NOT NULL REFERENCES public.dealerships(id) ON DELETE RESTRICT,
  seller_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  voucher_code text NOT NULL UNIQUE,
  selection_reason text NOT NULL DEFAULT 'HIGHEST' CHECK (selection_reason IN ('HIGHEST', 'NEAREST', 'OTHER')),
  agreed_amount_cents bigint NOT NULL CHECK (agreed_amount_cents > 0),
  accept_expires_at timestamptz NOT NULL,
  outcome public.match_outcome NOT NULL DEFAULT 'APPOINTMENT_CONFIRMED',
  final_price_cents bigint CHECK (final_price_cents IS NULL OR final_price_cents >= 0),
  outcome_notes text,
  logged_by_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  outcome_logged_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 18. Inspection Disputes & Arbitration (FR-AD-06)
CREATE TABLE IF NOT EXISTS public.disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  docket_number text NOT NULL UNIQUE,
  match_id uuid NOT NULL REFERENCES public.matches(id) ON DELETE RESTRICT,
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE RESTRICT,
  raised_by_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  assigned_admin_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  category public.dispute_category NOT NULL,
  status public.dispute_status NOT NULL DEFAULT 'INVESTIGATING',
  agreed_bid_cents bigint NOT NULL CHECK (agreed_bid_cents > 0),
  disputed_adjustment_cents bigint NOT NULL DEFAULT 0 CHECK (disputed_adjustment_cents >= 0),
  net_settlement_cents bigint NOT NULL CHECK (net_settlement_cents >= 0),
  allegation_summary text NOT NULL,
  hoist_evidence_notes text,
  technician_name text,
  evidence_photos_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  resolution_decision text CHECK (resolution_decision IS NULL OR resolution_decision IN ('APPROVE_ADJUSTMENT', 'REJECT_CLAIM', 'MUTUAL_CANCEL')),
  compliance_decision_notes text,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 19. Dispute Event Timeline
CREATE TABLE IF NOT EXISTS public.dispute_timeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id uuid NOT NULL REFERENCES public.disputes(id) ON DELETE CASCADE,
  actor_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_label text NOT NULL,
  action text NOT NULL,
  note text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 20. In-App Notification Feed (FR-EU-11, FR-DL-05)
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type public.notification_type NOT NULL DEFAULT 'SYSTEM',
  title text NOT NULL,
  description text NOT NULL,
  listing_id uuid REFERENCES public.listings(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  read boolean NOT NULL DEFAULT false,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 21. Outbound Channel Delivery Log (FR-X-01, CASL Audit)
CREATE TABLE IF NOT EXISTS public.notification_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id uuid REFERENCES public.notifications(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('IN_APP', 'EMAIL', 'SMS', 'PUSH')),
  provider text NOT NULL,
  recipient_address text,
  status text NOT NULL CHECK (status IN ('QUEUED', 'SENT', 'FAILED', 'SANDBOX_LOGGED', 'UNSUBSCRIBED')),
  provider_message_id text,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 22. Append-Only Immutable Audit Trail (FR-AD-09, NFR-11, H8)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_name text,
  actor_role text NOT NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  before_json jsonb,
  after_json jsonb,
  details text,
  ip_address text,
  provincial_jurisdiction text,
  immutable_hash text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable Row-Level Security on ALL 22 public tables (default-deny until 0004 policies)
ALTER TABLE public.platform_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dealerships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dealership_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.postal_centroids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vin_decode_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.damage_hotspots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispute_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
