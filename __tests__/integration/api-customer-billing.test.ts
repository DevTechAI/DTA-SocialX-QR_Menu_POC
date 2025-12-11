/**
 * Integration tests for /api/customer-billing endpoint
 * 
 * These tests require:
 * - NEXT_PUBLIC_SUPABASE_URL environment variable
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable
 * - A running Supabase instance with customer_allorders_details table
 * 
 * Run with: npm test -- __tests__/integration/api-customer-billing.test.ts
 */

// Mock Supabase server client before importing routes
import './setup/mock-supabase-server';

import { GET } from '@/app/api/customer-billing/route';
import { PATCH } from '@/app/api/customer-billing/[phone]/status/route';
import { NextRequest } from 'next/server';
import {
  createTestSupabaseClient,
  cleanupTestData,
  generateTestId,
  verifySupabaseConfig,
} from './setup/supabase-test-utils';

// Skip tests if Supabase is not configured
const shouldSkipTests = !verifySupabaseConfig();

describe('API Customer Billing Integration Tests', () => {
  let testId: string;
  let testPhone: string;

  beforeAll(() => {
    if (shouldSkipTests) {
      console.warn('⚠️  Skipping Supabase integration tests - credentials not configured');
    }
    testId = generateTestId();
    testPhone = `+91${Math.floor(1000000000 + Math.random() * 9000000000)}`;
  });

  afterAll(async () => {
    if (!shouldSkipTests) {
      // Cleanup test data
      await cleanupTestData('customer_allorders_details', testId);
    }
  });

  describe('GET /api/customer-billing', () => {
    it('should fetch customer billing records from Supabase', async () => {
      if (shouldSkipTests) {
        return;
      }

      const request = new NextRequest('http://localhost:3000/api/customer-billing', {
        method: 'GET',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe('PATCH /api/customer-billing/[phone]/status', () => {
    it('should update customer billing status', async () => {
      if (shouldSkipTests) {
        return;
      }

      // First, create a test customer record
      const supabase = createTestSupabaseClient();
      const { error: insertError } = await supabase
        .from('customer_allorders_details')
        .upsert({
          customer_phno: testPhone,
          customer_name: `Test Customer ${testId}`,
          total_ordered_value_at_socialx: 100,
          latestdate_allorder_status: 'UNPAID',
        });

      if (insertError) {
        console.warn('Could not create test customer record:', insertError);
        return;
      }

      const request = new NextRequest(
        `http://localhost:3000/api/customer-billing/${encodeURIComponent(testPhone)}/status`,
        {
          method: 'PATCH',
          body: JSON.stringify({ status: 'PAID' }),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      // Create a mock params object for the route handler
      const params = { phone: testPhone };
      const response = await PATCH(request, { params } as any);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('success', true);

      // Verify status was updated
      const { data: customer, error } = await supabase
        .from('customer_allorders_details')
        .select('latestdate_allorder_status')
        .eq('customer_phno', testPhone)
        .single();

      expect(error).toBeNull();
      expect(customer?.latestdate_allorder_status).toBe('PAID');
    });

    it('should reject invalid status', async () => {
      if (shouldSkipTests) {
        return;
      }

      const request = new NextRequest(
        `http://localhost:3000/api/customer-billing/${encodeURIComponent(testPhone)}/status`,
        {
          method: 'PATCH',
          body: JSON.stringify({ status: 'INVALID_STATUS' }),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      // Create a mock params object for the route handler
      const params = { phone: testPhone };
      const response = await PATCH(request, { params } as any);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });
  });
});

