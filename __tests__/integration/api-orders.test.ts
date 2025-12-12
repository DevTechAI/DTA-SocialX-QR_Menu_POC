/**
 * Integration tests for /api/orders endpoint
 * 
 * These tests require:
 * - NEXT_PUBLIC_SUPABASE_URL environment variable
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable
 * - A running Supabase instance with the orders table
 * 
 * Run with: npm test -- __tests__/integration/api-orders.test.ts
 */

// Mock Supabase server client before importing routes
import './setup/mock-supabase-server';

import { POST, GET } from '@/app/api/orders/route';
import { NextRequest } from 'next/server';
import {
  createTestSupabaseClient,
  cleanupTestData,
  generateTestId,
  createTestOrderPayload,
  verifySupabaseConfig,
} from './setup/supabase-test-utils';

// Skip tests if Supabase is not configured
const shouldSkipTests = !verifySupabaseConfig();

describe('API Orders Integration Tests', () => {
  let testId: string;
  let testPhone: string;

  beforeAll(() => {
    if (shouldSkipTests) {
      console.warn('⚠️  Skipping Supabase integration tests - credentials not configured');
    }
    testId = generateTestId();
  });

  afterAll(async () => {
    if (!shouldSkipTests) {
      // Cleanup test data
      await cleanupTestData('orders', testId);
    }
  });

  describe('POST /api/orders', () => {
    it('should create an order in Supabase', async () => {
      if (shouldSkipTests) {
        return;
      }

      const payload = createTestOrderPayload(testId);
      testPhone = payload.customer_phno;

      const request = new NextRequest('http://localhost:3000/api/orders', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toHaveProperty('id');
      expect(data.customer_name).toBe(payload.customer_name);
      expect(data.customer_phno || data.customer_phNo).toBe(payload.customer_phno);
      expect(data.total_amount).toBe(payload.total_amount);
      expect(data.status).toBe('received');

      // Verify in database
      const supabase = createTestSupabaseClient();
      const { data: dbOrder, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', data.id)
        .single();

      expect(error).toBeNull();
      expect(dbOrder).toBeTruthy();
      expect(dbOrder.customer_name).toBe(payload.customer_name);
    });

    it('should reject order with missing required fields', async () => {
      if (shouldSkipTests) {
        return;
      }

      const request = new NextRequest('http://localhost:3000/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          customer_name: 'Test',
          // Missing customer_phno, items, total_amount
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error');
    });

    it('should handle invalid order data gracefully', async () => {
      if (shouldSkipTests) {
        return;
      }

      const request = new NextRequest('http://localhost:3000/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          customer_name: '',
          customer_phno: '',
          items: [],
          total_amount: -100,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('GET /api/orders', () => {
    it('should fetch orders from Supabase', async () => {
      if (shouldSkipTests) {
        return;
      }

      const request = new NextRequest('http://localhost:3000/api/orders', {
        method: 'GET',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
    });

    it('should fetch orders by business day', async () => {
      if (shouldSkipTests) {
        return;
      }

      const request = new NextRequest('http://localhost:3000/api/orders?business_day=true', {
        method: 'GET',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
    });

    it('should fetch orders by customer name', async () => {
      if (shouldSkipTests) {
        return;
      }

      const request = new NextRequest(
        `http://localhost:3000/api/orders?customer_name=Test Customer ${testId}`,
        {
          method: 'GET',
        }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
    });
  });
});

