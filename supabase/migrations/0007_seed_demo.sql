-- ============================================================================
-- Migration 0007: Idempotent Platform Defaults, Plans, Centroids & Demo Dealerships
-- All currency stored strictly as BIGINT integer CAD cents (NFR-14)
-- ============================================================================

-- 1. Configurable Platform Rules (FR-AD-08)
INSERT INTO public.platform_config (key, value_json, description)
VALUES
  ('auction_duration_hours', '24'::jsonb, 'Fixed duration in hours for active dealer sealed-bid auctions (BR-03)'),
  ('acceptance_window_hours', '24'::jsonb, 'Fixed seller in-person acceptance window in hours (BR-08)'),
  ('relist_cooldown_hours', '24'::jsonb, 'Mandatory cooldown in hours before zero-bid or expired listings can relist (BR-12)'),
  ('min_photo_count', '8'::jsonb, 'Minimum required vehicle photos per listing submission (FR-EU-05)'),
  ('default_radius_km', '100'::jsonb, 'Default dealership notification & feed sourcing radius in km')
ON CONFLICT (key) DO UPDATE SET
  value_json = EXCLUDED.value_json,
  description = EXCLUDED.description;

-- 2. Dealership SaaS Subscription Plans (CAD integer cents)
INSERT INTO public.plans (slug, name, billing_interval, price_cents, currency, monthly_bid_quota, max_radius_km, max_team_seats, features_json)
VALUES
  (
    'basic-monthly',
    'Basic',
    'month',
    29900,
    'CAD',
    25,
    100,
    3,
    '["25 monthly sealed bids","100 km regional sourcing radius","Up to 3 dealership seats","Standard Carfax & damage dossier"]'::jsonb
  ),
  (
    'pro-monthly',
    'Pro',
    'month',
    59900,
    'CAD',
    75,
    250,
    10,
    '["75 monthly sealed bids","250 km regional sourcing radius","Up to 10 dealership seats","Priority auction alerts & win-rate telemetry"]'::jsonb
  ),
  (
    'enterprise-monthly',
    'Enterprise',
    'month',
    119900,
    'CAD',
    250,
    500,
    25,
    '["250 monthly sealed bids","500 km inter-provincial radius","Up to 25 dealership seats","Multi-rooftop analytics & dedicated account support"]'::jsonb
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  price_cents = EXCLUDED.price_cents,
  monthly_bid_quota = EXCLUDED.monthly_bid_quota,
  max_radius_km = EXCLUDED.max_radius_km,
  max_team_seats = EXCLUDED.max_team_seats,
  features_json = EXCLUDED.features_json,
  is_active = true;

-- 3. Seed GTA & Major Canadian City Postal FSA Centroids (for PostGIS radius queries)
INSERT INTO public.postal_centroids (postal_prefix, city, province, latitude, longitude, location)
VALUES
  ('M5V', 'Toronto', 'ON', 43.6426, -79.3871, extensions.ST_SetSRID(extensions.ST_MakePoint(-79.3871, 43.6426), 4326)::extensions.geography),
  ('M5J', 'Toronto', 'ON', 43.6414, -79.3807, extensions.ST_SetSRID(extensions.ST_MakePoint(-79.3807, 43.6414), 4326)::extensions.geography),
  ('L3R', 'Markham', 'ON', 43.8461, -79.3370, extensions.ST_SetSRID(extensions.ST_MakePoint(-79.3370, 43.8461), 4326)::extensions.geography),
  ('L6M', 'Oakville', 'ON', 43.4375, -79.7400, extensions.ST_SetSRID(extensions.ST_MakePoint(-79.7400, 43.4375), 4326)::extensions.geography),
  ('L6H', 'Oakville', 'ON', 43.4675, -79.6877, extensions.ST_SetSRID(extensions.ST_MakePoint(-79.6877, 43.4675), 4326)::extensions.geography),
  ('L4K', 'Vaughan', 'ON', 43.7975, -79.5280, extensions.ST_SetSRID(extensions.ST_MakePoint(-79.5280, 43.7975), 4326)::extensions.geography),
  ('L5B', 'Mississauga', 'ON', 43.5890, -79.6441, extensions.ST_SetSRID(extensions.ST_MakePoint(-79.6441, 43.5890), 4326)::extensions.geography),
  ('H3A', 'Montreal', 'QC', 45.5017, -73.5673, extensions.ST_SetSRID(extensions.ST_MakePoint(-73.5673, 45.5017), 4326)::extensions.geography),
  ('H7T', 'Laval', 'QC', 45.5653, -73.7495, extensions.ST_SetSRID(extensions.ST_MakePoint(-73.7495, 45.5653), 4326)::extensions.geography),
  ('T2P', 'Calgary', 'AB', 51.0447, -114.0719, extensions.ST_SetSRID(extensions.ST_MakePoint(-114.0719, 51.0447), 4326)::extensions.geography),
  ('V6B', 'Vancouver', 'BC', 49.2827, -123.1207, extensions.ST_SetSRID(extensions.ST_MakePoint(-123.1207, 49.2827), 4326)::extensions.geography)
ON CONFLICT (postal_prefix) DO UPDATE SET
  city = EXCLUDED.city,
  province = EXCLUDED.province,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  location = EXCLUDED.location;

-- 4. Seed 3 Verified Demo Dealerships + Active Subscriptions
INSERT INTO public.dealerships (
  id, operating_name, legal_name, business_number, regulator, license_number,
  license_expiry, status, street_address, city, province, postal_code, location,
  service_radius_km, contact_name, contact_title, contact_email, contact_phone,
  operating_hours, rating, review_count, payout_speed_days, certified_pre_inspection, verified_at
)
VALUES
  (
    '11111111-1111-4111-8111-111111111101',
    'Pfaff Porsche Markham',
    'Pfaff Automotive Partners Inc.',
    '123456789RC0001',
    'OMVIC',
    'OMVIC-481920',
    DATE '2027-06-30',
    'VERIFIED',
    '10500 Highway 48',
    'Markham',
    'ON',
    'L3R 5H6',
    extensions.ST_SetSRID(extensions.ST_MakePoint(-79.3370, 43.8461), 4326)::extensions.geography,
    250,
    'Christopher Evans',
    'Wholesale Acquisitions Director',
    'dealer@autonexa.ca',
    '+19055558291',
    'Monday - Saturday: 9:00 AM - 6:00 PM EST',
    4.92,
    312,
    1,
    true,
    now()
  ),
  (
    '11111111-1111-4111-8111-111111111102',
    'Oakville Luxury Motor Group',
    'Oakville Premier Imports Ltd.',
    '234567890RC0001',
    'OMVIC',
    'OMVIC-391204',
    DATE '2027-08-31',
    'VERIFIED',
    '2450 Wyecroft Road',
    'Oakville',
    'ON',
    'L6L 6M6',
    extensions.ST_SetSRID(extensions.ST_MakePoint(-79.7400, 43.4375), 4326)::extensions.geography,
    150,
    'Marcus Chen',
    'Pre-Owned Inventory Manager',
    'dealer2@autonexa.ca',
    '+19055554410',
    'Monday - Saturday: 8:30 AM - 6:00 PM EST',
    4.84,
    184,
    1,
    true,
    now()
  ),
  (
    '11111111-1111-4111-8111-111111111103',
    'Downtown Toronto Auto Mall',
    'Toronto Urban Automotive Corp.',
    '345678901RC0001',
    'OMVIC',
    'OMVIC-219582',
    DATE '2027-09-30',
    'VERIFIED',
    '425 Front Street West',
    'Toronto',
    'ON',
    'M5V 2T6',
    extensions.ST_SetSRID(extensions.ST_MakePoint(-79.3871, 43.6426), 4326)::extensions.geography,
    100,
    'Elena Vance',
    'Purchasing Director',
    'purchasing@torontoautomall.ca',
    '+14165557700',
    'Monday - Saturday: 9:00 AM - 7:00 PM EST',
    4.71,
    420,
    2,
    false,
    now()
  )
ON CONFLICT (regulator, license_number) DO UPDATE SET
  status = 'VERIFIED',
  operating_name = EXCLUDED.operating_name,
  location = EXCLUDED.location,
  service_radius_km = EXCLUDED.service_radius_km;

INSERT INTO public.subscriptions (dealership_id, plan_id, status, current_period_start, current_period_end, bids_used, auto_renew)
SELECT
  d.id,
  p.id,
  'ACTIVE',
  now(),
  now() + interval '1 year',
  0,
  true
FROM public.dealerships d
JOIN public.plans p ON (
  (d.license_number = 'OMVIC-481920' AND p.slug = 'enterprise-monthly')
  OR (d.license_number IN ('OMVIC-391204', 'OMVIC-219582') AND p.slug = 'pro-monthly')
)
ON CONFLICT (dealership_id) DO UPDATE SET
  status = 'ACTIVE',
  current_period_end = now() + interval '1 year',
  plan_id = EXCLUDED.plan_id;
