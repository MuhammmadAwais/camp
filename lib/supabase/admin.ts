import { createClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/server/env";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Strictly server-only Supabase admin client using `SUPABASE_SECRET_KEY`.
 *
 * SECURITY WARNING: This client BYPASSES PostgreSQL Row-Level Security (RLS).
 * Restrict usage strictly to verified webhooks, system background jobs,
 * and explicitly RBAC-checked admin/cross-tenant operations.
 */
export function createAdminSupabaseClient() {
  if (typeof window !== "undefined") {
    throw new Error(
      "lib/supabase/admin.ts must never be imported or executed in client code."
    );
  }

  const { supabaseUrl, supabaseSecretKey } = getServerEnv();

  return createClient<Database>(supabaseUrl, supabaseSecretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
