# Supabase Integration Tests

This directory contains integration tests for Supabase API endpoints.

## Setup

### Prerequisites

1. **Supabase Project**: You need a Supabase project with the required tables:
   - `orders`
   - `workspace_seat_booking_orders`
   - `snooker_booking_orders`
   - `customer_allorders_details`
   - `workspace_seat_menu_items`
   - `snooker_board_menu_items`

2. **Environment Variables**: Create a `.env.test` file (or use `.env.local`) with:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

### Installation

The test dependencies are already included in `package.json`. If you need to install them:

```bash
npm install
```

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Only Integration Tests
```bash
npm run test:integration
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Run a Specific Test File
```bash
npm test -- __tests__/integration/api-orders.test.ts
```

## Test Structure

```
__tests__/
  integration/
    setup/
      supabase-test-utils.ts    # Test utilities and helpers
    api-orders.test.ts          # Orders API tests
    api-workspace-bookings.test.ts  # Workspace bookings API tests
    api-customer-billing.test.ts    # Customer billing API tests
```

## Test Utilities

The `supabase-test-utils.ts` file provides:

- `createTestSupabaseClient()` - Creates a Supabase client for testing
- `cleanupTestData()` - Cleans up test data after tests
- `generateTestId()` - Generates unique test identifiers
- `createTestOrderPayload()` - Creates test order data
- `createTestWorkspaceBookingPayload()` - Creates test workspace booking data
- `verifySupabaseConfig()` - Verifies Supabase is configured

## Writing New Tests

1. Import the test utilities:
   ```typescript
   import {
     createTestSupabaseClient,
     cleanupTestData,
     generateTestId,
     verifySupabaseConfig,
   } from './setup/supabase-test-utils';
   ```

2. Use `shouldSkipTests` to skip tests if Supabase is not configured:
   ```typescript
   const shouldSkipTests = !verifySupabaseConfig();
   ```

3. Clean up test data in `afterAll`:
   ```typescript
   afterAll(async () => {
     if (!shouldSkipTests) {
       await cleanupTestData('table_name', testId);
     }
   });
   ```

4. Use `generateTestId()` to create unique test identifiers:
   ```typescript
   const testId = generateTestId();
   ```

## Notes

- Tests will automatically skip if Supabase credentials are not configured
- Test data is automatically cleaned up after each test suite
- Tests use real Supabase connections (not mocks) to verify actual database behavior
- Each test generates unique identifiers to avoid conflicts

## Troubleshooting

### Tests are Skipped

If tests are being skipped, check:
1. Environment variables are set correctly
2. `.env.test` or `.env.local` file exists
3. Supabase URL doesn't contain "placeholder"

### Database Errors

If you see database errors:
1. Verify all required tables exist in Supabase
2. Check RLS (Row Level Security) policies allow test operations
3. Verify your anon key has the necessary permissions

### Connection Errors

If you see connection errors:
1. Verify your Supabase project is active
2. Check your network connection
3. Verify the Supabase URL is correct

