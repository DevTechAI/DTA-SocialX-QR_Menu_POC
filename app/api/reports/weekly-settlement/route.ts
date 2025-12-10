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
      .select('total_amount, status, created_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (foodError) {
      console.error('Error fetching food orders:', foodError);
    }

    // Fetch Snooker Bookings for the week
    const { data: snookerBookings, error: snookerError } = await supabase
      .from('snooker_booking_orders')
      .select('total_order_amount, order_status, created_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (snookerError) {
      console.error('Error fetching snooker bookings:', snookerError);
    }

    // Fetch Workspace Bookings for the week
    const { data: workspaceBookings, error: workspaceError } = await supabase
      .from('workspace_seat_booking_orders')
      .select('total_order_value, created_at')
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

    // Calculate daily breakdown
    const dailyBreakdown = calculateDailyBreakdown(foodOrders || [], snookerBookings || [], workspaceBookings || [], startDate);

    return NextResponse.json({
      weekStart,
      weekEnd: endDate.toISOString().split('T')[0],
      summary: {
        foodOrders: {
          count: foodOrderCount,
          total: foodTotal,
          currency: 'INR'
        },
        snookerBookings: {
          count: snookerBookingCount,
          total: snookerTotal,
          currency: 'INR'
        },
        workspaceBookings: {
          count: workspaceBookingCount,
          total: workspaceTotal,
          currency: 'INR'
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

