-- ============================================================================
-- Migration 0015: Annual CAD Subscription Plans & Seeded Dealership Invoices
-- Implements Prompt B7.1 (FR-DL-03, FR-DL-11, FR-AD-05, NFR-14 integer cents)
-- ============================================================================

INSERT INTO public.plans (
  slug,
  name,
  billing_interval,
  price_cents,
  currency,
  monthly_bid_quota,
  max_radius_km,
  max_team_seats,
  features_json,
  is_active
)
VALUES
  (
    'basic-annual',
    'Basic',
    'year',
    286800,
    'CAD',
    25,
    100,
    3,
    '["25 monthly sealed bids","100 km regional sourcing radius","Up to 3 dealership seats","Standard Carfax & damage dossier"]'::jsonb,
    true
  ),
  (
    'pro-annual',
    'Pro',
    'year',
    574800,
    'CAD',
    75,
    250,
    10,
    '["75 monthly sealed bids","250 km regional sourcing radius","Up to 10 dealership seats","Priority auction alerts & win-rate telemetry"]'::jsonb,
    true
  ),
  (
    'enterprise-annual',
    'Enterprise',
    'year',
    1150800,
    'CAD',
    250,
    500,
    25,
    '["250 monthly sealed bids","500 km inter-provincial radius","Up to 25 dealership seats","Multi-rooftop analytics & dedicated account support"]'::jsonb,
    true
  )
ON CONFLICT (slug) DO NOTHING;

-- Seed 1 initial PAID CAD invoice per seeded dealership via dynamic subscription lookup
INSERT INTO public.payments (
  subscription_id,
  dealership_id,
  invoice_number,
  amount_cents,
  currency,
  status,
  description,
  paid_at
)
SELECT
  s.id,
  seed.dealership_id,
  seed.invoice_number,
  seed.amount_cents,
  'CAD',
  'PAID',
  seed.description,
  now() - interval '7 days'
FROM (
  VALUES
    (
      '11111111-1111-4111-8111-111111111101'::uuid,
      'INV-2026-1001',
      119900::bigint,
      'AutoNexa Enterprise — Monthly Wholesale Subscription (CAD)'
    ),
    (
      '11111111-1111-4111-8111-111111111102'::uuid,
      'INV-2026-1002',
      59900::bigint,
      'AutoNexa Pro — Monthly Wholesale Subscription (CAD)'
    ),
    (
      '11111111-1111-4111-8111-111111111103'::uuid,
      'INV-2026-1003',
      59900::bigint,
      'AutoNexa Pro — Monthly Wholesale Subscription (CAD)'
    )
) AS seed(dealership_id, invoice_number, amount_cents, description)
JOIN public.subscriptions s ON s.dealership_id = seed.dealership_id
ON CONFLICT (invoice_number) DO NOTHING;
