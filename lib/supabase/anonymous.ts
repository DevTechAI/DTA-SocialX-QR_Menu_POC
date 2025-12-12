import { createClient } from '@supabase/supabase-js';

/**
 * Creates an anonymous Supabase client for public API endpoints
 * This is used for analytics and other public-facing operations
 * that don't require authentication
 */
export const createAnonymousClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

