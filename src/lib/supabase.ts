import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
import { isSecretSupabaseKey, SECRET_KEY_ERROR } from './supabase-keys';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
// Never use a secret key as the public key: it would bypass RLS everywhere
const keyIsSecret = Boolean(supabaseAnonKey) && isSecretSupabaseKey(supabaseAnonKey);

export const supabase = (supabaseUrl && supabaseAnonKey && !keyIsSecret) 
  ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }) 
  : null;

if (keyIsSecret) {
  console.error(SECRET_KEY_ERROR);
} else if (!supabase) {
  console.error('SUPABASE ERROR: Environment variables are missing. Initialization skipped.');
}
