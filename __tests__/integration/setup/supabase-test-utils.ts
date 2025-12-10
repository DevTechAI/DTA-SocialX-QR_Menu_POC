import { createClient } from '@supabase/supabase-js';

/**
 * Test utilities for Supabase integration tests
 */

// Get test Supabase credentials from environment
const getTestSupabaseConfig = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder')) {
    throw new Error(
      'Supabase test credentials not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your test environment.'
    );
  }

  return { supabaseUrl, supabaseKey };
};

/**
 * Creates a Supabase client for testing
 */
export const createTestSupabaseClient = () => {
  const { supabaseUrl, supabaseKey } = getTestSupabaseConfig();
  return createClient(supabaseUrl, supabaseKey);
};

/**
 * Cleans up test data from the database
 */
export const cleanupTestData = async (table: string, testId: string) => {
  const supabase = createTestSupabaseClient();
  
  try {
    // Delete records that contain the test ID in any field
    const { error } = await supabase
      .from(table)
      .delete()
      .or(`customer_name.ilike.%${testId}%,customer_phno.ilike.%${testId}%`);
    
    if (error && error.code !== 'PGRST116') {
      console.warn(`Cleanup warning for ${table}:`, error.message);
    }
  } catch (error) {
    console.warn(`Cleanup error for ${table}:`, error);
  }
};

/**
 * Generates a unique test identifier
 */
export const generateTestId = (): string => {
  return `test-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * Waits for a specified amount of time (useful for async operations)
 */
export const wait = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Creates a test order payload
 */
export const createTestOrderPayload = (testId: string) => ({
  customer_name: `Test Customer ${testId}`,
  customer_phno: `+91${Math.floor(1000000000 + Math.random() * 9000000000)}`,
  items: [
    {
      menu_item_id: 'hot-latte',
      name: 'Latte',
      quantity: 1,
      price: 114,
    },
  ],
  total_amount: 114,
  table_number: `T${testId.substring(0, 3)}`,
});

/**
 * Creates a test workspace booking payload
 */
export const createTestWorkspaceBookingPayload = (testId: string, workspaceSeatId: string) => ({
  customer_name: `Test Customer ${testId}`,
  customer_phno: `+91${Math.floor(1000000000 + Math.random() * 9000000000)}`,
  workspace_seat_id: workspaceSeatId,
  seats_count: '1',
  total_order_value: 220,
});

/**
 * Creates a test snooker booking payload
 */
export const createTestSnookerBookingPayload = (testId: string, boardId: string) => ({
  customer_name: `Test Customer ${testId}`,
  customer_phno: `+91${Math.floor(1000000000 + Math.random() * 9000000000)}`,
  snooker_board_id: boardId,
  players_count: 2,
});

/**
 * Verifies Supabase is configured for testing
 */
export const verifySupabaseConfig = (): boolean => {
  try {
    getTestSupabaseConfig();
    return true;
  } catch {
    return false;
  }
};

