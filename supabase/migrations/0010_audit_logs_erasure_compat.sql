-- ============================================================================
-- Migration 0010: Audit Log Immutability Preserving Auth User Erasure
-- Allows ONLY Postgres ON DELETE SET NULL referential anonymization on
-- `audit_logs.actor_id` after the referenced `auth.users` row is deleted,
-- while blocking every DELETE and every other UPDATE (`AUDIT_LOGS_IMMUTABLE`).
-- ============================================================================

CREATE OR REPLACE FUNCTION public.prevent_audit_log_mutation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'UPDATE'
     AND OLD.actor_id IS NOT NULL
     AND NEW.actor_id IS NULL
     AND NEW.id = OLD.id
     AND NEW.actor_name IS NOT DISTINCT FROM OLD.actor_name
     AND NEW.actor_role IS NOT DISTINCT FROM OLD.actor_role
     AND NEW.action IS NOT DISTINCT FROM OLD.action
     AND NEW.entity_type IS NOT DISTINCT FROM OLD.entity_type
     AND NEW.entity_id IS NOT DISTINCT FROM OLD.entity_id
     AND NEW.before_json IS NOT DISTINCT FROM OLD.before_json
     AND NEW.after_json IS NOT DISTINCT FROM OLD.after_json
     AND NEW.details IS NOT DISTINCT FROM OLD.details
     AND NEW.ip_address IS NOT DISTINCT FROM OLD.ip_address
     AND NEW.provincial_jurisdiction IS NOT DISTINCT FROM OLD.provincial_jurisdiction
     AND NEW.immutable_hash IS NOT DISTINCT FROM OLD.immutable_hash
     AND NEW.created_at IS NOT DISTINCT FROM OLD.created_at
     AND NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = OLD.actor_id)
  THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'AUDIT_LOGS_IMMUTABLE: Audit records cannot be modified or deleted';
END;
$$;

REVOKE ALL ON FUNCTION public.prevent_audit_log_mutation() FROM PUBLIC, anon, authenticated;
