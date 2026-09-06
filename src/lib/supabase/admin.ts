import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase client for server-side writes.
 *
 * The publishable key used by `server.ts` is subject to row level security, and
 * schema.sql grants only read policies — so inserts made with it are rejected.
 * Writes go through the service-role key instead, which bypasses RLS.
 *
 * This key must never reach the browser: only import this from route handlers
 * or server actions, never from a Client Component.
 */
export const createAdminClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

  // Supabase renamed its keys: newer projects issue "secret" keys (sb_secret_...),
  // older ones a "service_role" JWT. Either works here, so accept both names.
  const secretKey =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set.");
  }

  if (!secretKey) {
    throw new Error(
      "No Supabase secret key is set. Copy the secret (service_role) key from the " +
        "Supabase dashboard -> Project Settings -> API Keys, add it to .env.local as " +
        "SUPABASE_SECRET_KEY, then restart the dev server."
    );
  }

  return createSupabaseClient(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
};
