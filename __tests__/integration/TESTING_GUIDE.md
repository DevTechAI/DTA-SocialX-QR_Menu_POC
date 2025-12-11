# Supabase Integration Testing Guide

## Quick Start

### 1. Set Up Environment Variables

Create `.env.test` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Or use your existing `.env.local` file.

### 2. Run Tests

```bash
# Run all integration tests
npm run test:integration

# Run a specific test file
npm test -- __tests__/integration/api-orders.test.ts

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

## Test Files

| File | Tests |
|------|-------|
| `api-orders.test.ts` | Order creation, fetching, validation |
| `api-workspace-bookings.test.ts` | Workspace booking creation and fetching |
| `api-customer-billing.test.ts` | Customer billing records and status updates |

## Test Features

✅ **Automatic Cleanup**: Test data is automatically cleaned up after each test suite  
✅ **Unique Test IDs**: Each test generates unique identifiers to avoid conflicts  
✅ **Graceful Skipping**: Tests automatically skip if Supabase is not configured  
✅ **Real Database**: Tests use actual Supabase connections (not mocks)  
✅ **Error Handling**: Comprehensive error testing for invalid inputs  

## Example Test Output

```
PASS  __tests__/integration/api-orders.test.ts
  API Orders Integration Tests
    POST /api/orders
      ✓ should create an order in Supabase (1234ms)
      ✓ should reject order with missing required fields (45ms)
    GET /api/orders
      ✓ should fetch orders from Supabase (234ms)

Test Suites: 1 passed, 1 total
Tests:       3 passed, 3 total
```

## Troubleshooting

### Tests are Skipped

**Problem**: Tests show "⚠️ Skipping Supabase integration tests"

**Solution**: 
1. Check `.env.test` or `.env.local` exists
2. Verify environment variables are set
3. Ensure Supabase URL doesn't contain "placeholder"

### Database Errors

**Problem**: Tests fail with database errors

**Solution**:
1. Verify all required tables exist in Supabase
2. Check RLS policies allow test operations
3. Verify anon key has necessary permissions

### Type Errors

**Problem**: TypeScript errors in test files

**Solution**:
```bash
npm run type-check
```

## Adding New Tests

1. Create a new test file in `__tests__/integration/`
2. Import test utilities from `./setup/supabase-test-utils`
3. Use `generateTestId()` for unique identifiers
4. Clean up test data in `afterAll` hook
5. Use `shouldSkipTests` to handle missing config

Example:

```typescript
import { generateTestId, cleanupTestData, verifySupabaseConfig } from './setup/supabase-test-utils';

const shouldSkipTests = !verifySupabaseConfig();

describe('My API Tests', () => {
  let testId: string;

  beforeAll(() => {
    testId = generateTestId();
  });

  afterAll(async () => {
    if (!shouldSkipTests) {
      await cleanupTestData('my_table', testId);
    }
  });

  it('should do something', async () => {
    if (shouldSkipTests) return;
    // Your test code here
  });
});
```

