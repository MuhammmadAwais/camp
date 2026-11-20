-- ============================================================================
-- Migration 0009: Storage Buckets & Object RLS Policies
-- Provisions listing-media (public read, owner upload), kyc-docs (strictly
-- private), and dispute-evidence (participant/admin private bucket).
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'listing-media',
    'listing-media',
    true,
    20971520,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
  ),
  (
    'kyc-docs',
    'kyc-docs',
    false,
    10485760,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
  ),
  (
    'dispute-evidence',
    'dispute-evidence',
    false,
    20971520,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf']
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'listing_media_public_select'
  ) THEN
    CREATE POLICY listing_media_public_select ON storage.objects
      FOR SELECT TO public
      USING (bucket_id = 'listing-media');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'listing_media_owner_insert'
  ) THEN
    CREATE POLICY listing_media_owner_insert ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (
        bucket_id = 'listing-media'
        AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'listing_media_owner_delete'
  ) THEN
    CREATE POLICY listing_media_owner_delete ON storage.objects
      FOR DELETE TO authenticated
      USING (
        bucket_id = 'listing-media'
        AND (
          (storage.foldername(name))[1] = (SELECT auth.uid())::text
          OR (SELECT private.is_admin())
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'kyc_docs_admin_select'
  ) THEN
    CREATE POLICY kyc_docs_admin_select ON storage.objects
      FOR SELECT TO authenticated
      USING (
        bucket_id = 'kyc-docs'
        AND (SELECT private.is_admin())
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'dispute_evidence_owner_or_admin_select'
  ) THEN
    CREATE POLICY dispute_evidence_owner_or_admin_select ON storage.objects
      FOR SELECT TO authenticated
      USING (
        bucket_id = 'dispute-evidence'
        AND (
          (storage.foldername(name))[1] = (SELECT auth.uid())::text
          OR (SELECT private.is_admin())
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'dispute_evidence_owner_insert'
  ) THEN
    CREATE POLICY dispute_evidence_owner_insert ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (
        bucket_id = 'dispute-evidence'
        AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
      );
  END IF;
END $$;
