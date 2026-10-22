/**
 * Guard against putting a Supabase SECRET key in PUBLIC_SUPABASE_ANON_KEY.
 *
 * PUBLIC_* variables are inlined into the build, and a secret key bypasses
 * Row Level Security — so a mix-up would silently disable RLS for the whole
 * site. Covers both the new secret keys (sb_secret_…) and legacy JWT keys
 * with role "service_role".
 */
export function isSecretSupabaseKey(key: string): boolean {
  if (key.startsWith('sb_secret_')) return true;

  const payload = key.split('.')[1];
  if (!payload) return false;
  try {
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json).role === 'service_role';
  } catch {
    return false;
  }
}

export const SECRET_KEY_ERROR =
  'SUPABASE ERROR: PUBLIC_SUPABASE_ANON_KEY contains a SECRET key. Use the publishable ' +
  '(sb_publishable_…) or anon key there; the secret key belongs only in SUPABASE_SERVICE_ROLE_KEY.';
