import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AuthService } from '@/services/AuthService';

export async function GET(request: NextRequest) {
  try {
    const authService = new AuthService();
    await authService.requireRole('manager');

    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // Get start and end of day in UTC
    const startDate = new Date(`${date}T00:00:00.000Z`);
    const endDate = new Date(`${date}T23:59:59.999Z`);

    // Fetch Food Orders for the day
    const { data: foodOrders, error: foodError } = await supabase
      .from('orders')
      .select('total_amount, status')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (foodError) {
      console.error('Error fetching food orders:', foodError);
    }

    // Fetch Snooker Bookings for the day
    const { data: snookerBookings, error: snookerError } = await supabase
      .from('snooker_booking_orders')
      .select('total_order_amount, order_status')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (snookerError) {
      console.error('Error fetching snooker bookings:', snookerError);
    }

    // Fetch Workspace Bookings for the day
    const { data: workspaceBookings, error: workspaceError } = await supabase
      .from('workspace_seat_booking_orders')
      .select('total_order_value')
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

    return NextResponse.json({
      date,
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
    console.error('Error generating daily settlement report:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate daily settlement report' },
      { status: 500 }
    );
  }
}

