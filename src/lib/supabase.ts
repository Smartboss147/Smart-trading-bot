import { createClient } from '@supabase/supabase-js';

const rawUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || '';
const rawKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || '';

export const isSupabaseConfigured = Boolean(
  rawUrl &&
  !rawUrl.includes('placeholder.supabase.co') &&
  rawUrl.startsWith('http') &&
  rawKey &&
  !rawKey.includes('placeholder') &&
  rawKey.length > 20
);

const supabaseUrl = isSupabaseConfigured ? rawUrl : 'https://placeholder.supabase.co';
const supabaseAnonKey = isSupabaseConfigured ? rawKey : 'placeholder-anon-key-long-enough-for-client';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: isSupabaseConfigured,
    autoRefreshToken: isSupabaseConfigured,
    detectSessionInUrl: isSupabaseConfigured
  }
});

