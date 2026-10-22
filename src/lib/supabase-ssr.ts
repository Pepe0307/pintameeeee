import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { Database } from './database.types';
import type { AstroCookies } from 'astro';
import { isSecretSupabaseKey, SECRET_KEY_ERROR } from './supabase-keys';

export const createSupabaseServerClient = (cookies: AstroCookies) => {
  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase environment variables are missing.');
  }
  // Never use a secret key as the public key: it would bypass RLS everywhere
  if (isSecretSupabaseKey(supabaseAnonKey)) {
    throw new Error(SECRET_KEY_ERROR);
  }

  return createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(key: string) {
          return cookies.get(key)?.value;
        },
        set(key: string, value: string, options: CookieOptions) {
          cookies.set(key, value, { ...options, path: '/' });
        },
        remove(key: string, options: CookieOptions) {
          cookies.delete(key, { ...options, path: '/' });
        },
      },
    }
  );
};
