/**
 * Supabase client with the service role key (server-only).
 *
 * The service role BYPASSES Row Level Security. Only use it in API routes and
 * server code that has already validated its input — never in client scripts.
 * The key is read at runtime via astro:env, so it is never inlined in the build.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getSecret } from 'astro:env/server';
import type { Database } from './database.types';

export function getSupabaseAdmin(): SupabaseClient<Database> | null {
  const url = import.meta.env.PUBLIC_SUPABASE_URL;
  const serviceKey = (getSecret('SUPABASE_SERVICE_ROLE_KEY') ?? '').trim();
  if (!url || !serviceKey) return null;

  return createClient<Database>(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
