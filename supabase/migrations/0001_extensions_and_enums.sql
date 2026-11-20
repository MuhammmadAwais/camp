-- ============================================================================
-- Migration 0001: Extensions and Canonical Domain Enums
-- Reconciled across SRS v1.0 & AutoNexa/CAMP Frontend TypeScript Contracts
-- ============================================================================

-- 1. Extensions (install PostGIS & pgcrypto in `extensions` schema, pg_cron in `pg_catalog`)
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- 2. Canonical Domain Enum Types (idempotent creation)
DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('SELLER', 'DEALER_ADMIN', 'DEALER_AGENT', 'ADMIN');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.dealer_seat_role AS ENUM ('DEALER_ADMIN', 'DEALER_BUYER', 'DEALER_INSPECTOR');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.kyc_status AS ENUM ('NOT_STARTED', 'PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.id_doc_type AS ENUM ('DRIVERS_LICENCE', 'PASSPORT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.dealership_status AS ENUM ('PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED', 'REVOKED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.regulator_code AS ENUM ('OMVIC', 'AMVIC', 'VSA', 'OPC');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.listing_status AS ENUM (
    'DRAFT',
    'PENDING_MODERATION',
    'EDITS_REQUESTED',
    'REJECTED',
    'ACTIVE',
    'UNSEALED',
    'ACCEPTED',
    'COMPLETED',
    'EXPIRED',
    'CANCELLED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.damage_severity AS ENUM ('MINOR', 'MODERATE', 'SEVERE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.bid_status AS ENUM ('ACTIVE', 'WON', 'LOST', 'EXPIRED', 'WITHDRAWN', 'VOIDED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.match_outcome AS ENUM (
    'APPOINTMENT_CONFIRMED',
    'COMPLETED',
    'RENEGOTIATED_LOWER',
    'NO_SHOW',
    'DECLINED_AFTER_INSPECTION',
    'EXPIRED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.dispute_status AS ENUM ('INVESTIGATING', 'ACTION_REQUIRED', 'RESOLVED', 'CLOSED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.dispute_category AS ENUM (
    'UNDERBODY_DAMAGE',
    'MISSING_KEYS',
    'MECHANICAL_POWERTRAIN',
    'ODOMETER_DISCREPANCY',
    'UNRESOLVED_LIEN'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.subscription_status AS ENUM ('ACTIVE', 'TRIALING', 'PAST_DUE', 'EXPIRED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.notification_type AS ENUM (
    'BID',
    'KYC',
    'MODERATION',
    'AUCTION',
    'MATCH',
    'BILLING',
    'DISPUTE',
    'SYSTEM'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
