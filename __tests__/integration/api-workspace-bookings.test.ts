/**
 * Integration tests for /api/workspace-bookings endpoint
 * 
 * These tests require:
 * - NEXT_PUBLIC_SUPABASE_URL environment variable
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable
 * - A running Supabase instance with workspace_seat_booking_orders table
 * 
 * Run with: npm test -- __tests__/integration/api-workspace-bookings.test.ts
 */

// Mock Supabase server client before importing routes
import './setup/mock-supabase-server';

import { POST, GET } from '@/app/api/workspace-bookings/route';
import { NextRequest } from 'next/server';
import {
  createTestSupabaseClient,
  cleanupTestData,
  generateTestId,
  createTestWorkspaceBookingPayload,
  verifySupabaseConfig,
} from './setup/supabase-test-utils';

// Skip tests if Supabase is not configured
const shouldSkipTests = !verifySupabaseConfig();

describe('API Workspace Bookings Integration Tests', () => {
  let testId: string;
  let testPhone: string;
  let workspaceSeatId: string;

  beforeAll(async () => {
    if (shouldSkipTests) {
      console.warn('⚠️  Skipping Supabase integration tests - credentials not configured');
      return;
    }

    testId = generateTestId();

    // Get a valid workspace seat ID from the database
    const supabase = createTestSupabaseClient();
    const { data: seats } = await supabase
      .from('workspace_seat_menu_items')
      .select('workspace_seat_id')
      .limit(1)
      .single();

    if (seats) {
      workspaceSeatId = seats.workspace_seat_id;
    } else {
      // Use a default test ID if no seats exist
      workspaceSeatId = 'test-seat-1';
    }
  });

  afterAll(async () => {
    if (!shouldSkipTests) {
      // Cleanup test data
      await cleanupTestData('workspace_seat_booking_orders', testId);
    }
  });

  describe('POST /api/workspace-bookings', () => {
    it('should create a workspace booking in Supabase', async () => {
      if (shouldSkipTests) {
        return;
      }

      const payload = createTestWorkspaceBookingPayload(testId, workspaceSeatId);
      testPhone = payload.customer_phno;

      const request = new NextRequest('http://localhost:3000/api/workspace-bookings', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toHaveProperty('workspace_order_id');
      expect(data.customer_name).toBe(payload.customer_name);
      expect(data.customer_phno).toBe(payload.customer_phno);
      expect(data.workspace_seat_id).toBe(payload.workspace_seat_id);
      expect(data.seats_count).toBe(parseInt(payload.seats_count));
      expect(data.order_status).toBe('Received');

      // Verify in database
      const supabase = createTestSupabaseClient();
      const { data: dbBooking, error } = await supabase
        .from('workspace_seat_booking_orders')
        .select('*')
        .eq('workspace_order_id', data.workspace_order_id)
        .single();

      expect(error).toBeNull();
      expect(dbBooking).toBeTruthy();
      expect(dbBooking.customer_name).toBe(payload.customer_name);
    });

    it('should reject booking with missing required fields', async () => {
      if (shouldSkipTests) {
        return;
      }

      const request = new NextRequest('http://localhost:3000/api/workspace-bookings', {
        method: 'POST',
        body: JSON.stringify({
          customer_name: 'Test',
          // Missing other required fields
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
  });

  describe('GET /api/workspace-bookings', () => {
    it('should fetch workspace bookings from Supabase', async () => {
      if (shouldSkipTests) {
        return;
      }

      const request = new NextRequest('http://localhost:3000/api/workspace-bookings', {
        method: 'GET',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
    });
  });
});

