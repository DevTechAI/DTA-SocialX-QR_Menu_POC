import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AuthService } from '@/services/AuthService';

export async function GET(request: NextRequest) {
  try {
    const authService = new AuthService();
    await authService.requireRole('manager');

    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const weekStart = searchParams.get('weekStart') || getWeekStartDate();

    // Calculate week end date (6 days after start)
    const startDate = new Date(`${weekStart}T00:00:00.000Z`);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);

    // Fetch Food Orders for the week
    const { data: foodOrders, error: foodError } = await supabase
      .from('orders')
      .select('id, total_amount, status, created_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (foodError) {
      console.error('Error fetching food orders:', foodError);
    }

    // Fetch Snooker Bookings for the week
    const { data: snookerBookings, error: snookerError } = await supabase
      .from('snooker_booking_orders')
      .select('snooker_order_id, total_order_amount, order_status, created_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (snookerError) {
      console.error('Error fetching snooker bookings:', snookerError);
    }

    // Fetch Workspace Bookings for the week
    const { data: workspaceBookings, error: workspaceError } = await supabase
      .from('workspace_seat_booking_orders')
      .select('workspace_order_id, total_order_value, order_status, created_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (workspaceError) {
      console.error('Error fetching workspace bookings:', workspaceError);
    }

    // Calculate totals
    const foodTotal = (foodOrders || []).reduce((sum, order) => sum + (parseFloat(order.total_amount?.toString() || '0') || 0), 0);
    const snookerTotal = (snookerBookings || []).reduce((sum, booking) => sum + (parseFloat(booking.total_order_amount?.toString() || '0') || 0), 0);
    const workspaceTotal = (workspaceBookings || []).reduce((sum, booking) => sum + (parseFloat(booking.total_order_value?.toString() || '0') || 0), 0);
    const overallTotal = foodTotal + snookerTotal + workspaceTotal;

    // Count orders
    const foodOrderCount = foodOrders?.length || 0;
    const snookerBookingCount = snookerBookings?.length || 0;
    const workspaceBookingCount = workspaceBookings?.length || 0;
    const totalOrderCount = foodOrderCount + snookerBookingCount + workspaceBookingCount;

    // Calculate status breakdowns (same as daily report)
    const foodStatusBreakdown = calculateStatusBreakdown(
      foodOrders || [],
      'food',
      (order: any) => order.id,
      (order: any) => parseFloat(order.total_amount?.toString() || '0') || 0,
      (order: any) => order.status
    );

    const snookerStatusBreakdown = calculateStatusBreakdown(
      snookerBookings || [],
      'snooker',
      (booking: any) => booking.snooker_order_id,
      (booking: any) => parseFloat(booking.total_order_amount?.toString() || '0') || 0,
      (booking: any) => booking.order_status
    );

    const workspaceStatusBreakdown = calculateStatusBreakdown(
      workspaceBookings || [],
      'workspace',
      (booking: any) => booking.workspace_order_id,
      (booking: any) => parseFloat(booking.total_order_value?.toString() || '0') || 0,
      (booking: any) => booking.order_status
    );

    // Calculate daily breakdown
    const dailyBreakdown = calculateDailyBreakdown(foodOrders || [], snookerBookings || [], workspaceBookings || [], startDate);

    return NextResponse.json({
      weekStart,
      weekEnd: endDate.toISOString().split('T')[0],
      summary: {
        foodOrders: {
          count: foodOrderCount,
          total: foodTotal,
          currency: 'INR',
          statusBreakdown: foodStatusBreakdown
        },
        snookerBookings: {
          count: snookerBookingCount,
          total: snookerTotal,
          currency: 'INR',
          statusBreakdown: snookerStatusBreakdown
        },
        workspaceBookings: {
          count: workspaceBookingCount,
          total: workspaceTotal,
          currency: 'INR',
          statusBreakdown: workspaceStatusBreakdown
        },
        overall: {
          totalOrders: totalOrderCount,
          totalAmount: overallTotal,
          currency: 'INR'
        }
      },
      dailyBreakdown,
      details: {
        foodOrders: foodOrders || [],
        snookerBookings: snookerBookings || [],
        workspaceBookings: workspaceBookings || []
      }
    });
  } catch (error: any) {
    if (error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('Error generating weekly settlement report:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate weekly settlement report' },
      { status: 500 }
    );
  }
}

function getWeekStartDate(): string {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Monday as start
  const monday = new Date(today.setDate(diff));
  return monday.toISOString().split('T')[0];
}

function calculateDailyBreakdown(
  foodOrders: any[],
  snookerBookings: any[],
  workspaceBookings: any[],
  weekStart: Date
): any[] {
  const breakdown: Record<string, { food: number; snooker: number; workspace: number; total: number }> = {};

  // Initialize all 7 days
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    breakdown[dateStr] = { food: 0, snooker: 0, workspace: 0, total: 0 };
  }

  // Process food orders
  foodOrders.forEach(order => {
    const dateStr = new Date(order.created_at).toISOString().split('T')[0];
    if (breakdown[dateStr]) {
      breakdown[dateStr].food += parseFloat(order.total_amount?.toString() || '0') || 0;
    }
  });

  // Process snooker bookings
  snookerBookings.forEach(booking => {
    const dateStr = new Date(booking.created_at).toISOString().split('T')[0];
    if (breakdown[dateStr]) {
      breakdown[dateStr].snooker += parseFloat(booking.total_order_amount?.toString() || '0') || 0;
    }
  });

  // Process workspace bookings
  workspaceBookings.forEach(booking => {
    const dateStr = new Date(booking.created_at).toISOString().split('T')[0];
    if (breakdown[dateStr]) {
      breakdown[dateStr].workspace += parseFloat(booking.total_order_value?.toString() || '0') || 0;
    }
  });

  // Calculate totals for each day
  Object.keys(breakdown).forEach(date => {
    breakdown[date].total = breakdown[date].food + breakdown[date].snooker + breakdown[date].workspace;
  });

  return Object.entries(breakdown).map(([date, values]) => ({
    date,
    ...values
  }));
}

function calculateStatusBreakdown(
  orders: any[],
  type: 'food' | 'snooker' | 'workspace',
  getId: (order: any) => string,
  getAmount: (order: any) => number,
  getStatus: (order: any) => string
): { delivered: { count: number; total: number; orderIds: string[] }; paid: { count: number; total: number; orderIds: string[] }; unpaid: { count: number; total: number; orderIds: string[] } } {
  const delivered: { count: number; total: number; orderIds: string[] } = { count: 0, total: 0, orderIds: [] };
  const paid: { count: number; total: number; orderIds: string[] } = { count: 0, total: 0, orderIds: [] };
  const unpaid: { count: number; total: number; orderIds: string[] } = { count: 0, total: 0, orderIds: [] };

  orders.forEach((order) => {
    const id = getId(order);
    const amount = getAmount(order);
    const status = getStatus(order)?.toLowerCase() || '';

    if (type === 'food') {
      if (status === 'delivered') {
        delivered.count++;
        delivered.total += amount;
        delivered.orderIds.push(id);
      } else if (status === 'paid') {
        paid.count++;
        paid.total += amount;
        paid.orderIds.push(id);
      } else if (status === 'unpaid' || status === 'received' || status === 'accepted') {
        unpaid.count++;
        unpaid.total += amount;
        unpaid.orderIds.push(id);
      }
    } else if (type === 'snooker') {
      if (status === 'ended') {
        delivered.count++;
        delivered.total += amount;
        delivered.orderIds.push(id);
      } else if (status === 'paid') {
        paid.count++;
        paid.total += amount;
        paid.orderIds.push(id);
      } else {
        unpaid.count++;
        unpaid.total += amount;
        unpaid.orderIds.push(id);
      }
    } else if (type === 'workspace') {
      if (status === 'delivered' || status === 'pass-delivered') {
        delivered.count++;
        delivered.total += amount;
        delivered.orderIds.push(id);
      } else if (status === 'paid') {
        paid.count++;
        paid.total += amount;
        paid.orderIds.push(id);
      } else {
        unpaid.count++;
        unpaid.total += amount;
        unpaid.orderIds.push(id);
      }
    }
  });

  return { delivered, paid, unpaid };
}

