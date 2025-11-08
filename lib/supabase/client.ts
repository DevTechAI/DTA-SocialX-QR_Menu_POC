import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// Only create client if we have valid (non-placeholder) values
const isConfigured = 
  supabaseUrl && 
  !supabaseUrl.includes('placeholder') && 
  supabaseAnonKey && 
  !supabaseAnonKey.includes('placeholder');

export const supabase = isConfigured 
  ? createBrowserClient(supabaseUrl, supabaseAnonKey)
  : createBrowserClient('https://placeholder.supabase.co', 'placeholder-key');

export const isSupabaseConfigured = () => isConfigured;

