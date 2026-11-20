import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getPublicSupabaseEnv } from "@/lib/server/env";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Creates a per-request, cookie-bound Supabase server client that enforces
 * PostgreSQL Row-Level Security (RLS) for the authenticated caller.
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  const { url, publishableKey } = getPublicSupabaseEnv();

  return createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet, _headers) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Ignored when called inside a read-only Server Component;
          // proxy.ts handles refreshing expired Auth cookies.
        }
      },
    },
  });
}

export const createClient = createServerSupabaseClient;
