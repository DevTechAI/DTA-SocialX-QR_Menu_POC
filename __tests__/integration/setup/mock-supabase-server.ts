/**
 * Mock for lib/supabase/server.ts createClient function
 * This allows tests to use a direct Supabase client instead of the server client
 * which requires Next.js request context (cookies)
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Mock the server createClient to use a direct client instead
jest.mock('@/lib/supabase/server', () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder')) {
    // Return a mock that throws an error if Supabase is not configured
    return {
      createClient: () => {
        throw new Error('Supabase not configured for testing');
      },
    };
  }

  // Create a direct client (not using cookies/request context)
  const directClient = createSupabaseClient(supabaseUrl, supabaseKey);

  return {
    createClient: () => directClient,
  };
});

