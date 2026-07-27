import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { Database } from './database.types';
import type { AstroCookies } from 'astro';

export const createSupabaseServerClient = (cookies: AstroCookies) => {
  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase environment variables are missing.');
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
