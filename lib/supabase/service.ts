import { createClient } from '@supabase/supabase-js';

/**
 * Creates a Supabase client with service role key
 * This bypasses RLS and should only be used server-side for admin/analytics operations
 * Falls back to regular client if service key is not available (will use RLS policies)
 */
export const createServiceClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
  }

  // If service role key is available, use it to bypass RLS
  if (supabaseServiceKey) {
    return createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  // Fallback: Use anon key (will respect RLS policies)
  // This requires RLS policies to be set up for analytics tables
  console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY not found. Using anon key with RLS policies.');
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!anonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
  }

  return createClient(supabaseUrl, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

