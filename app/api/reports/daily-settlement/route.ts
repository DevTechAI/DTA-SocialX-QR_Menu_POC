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
      .select('id, total_amount, status')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (foodError) {
      console.error('Error fetching food orders:', foodError);
    }

    // Fetch Snooker Bookings for the day
    const { data: snookerBookings, error: snookerError } = await supabase
      .from('snooker_booking_orders')
      .select('snooker_order_id, total_order_amount, order_status')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (snookerError) {
      console.error('Error fetching snooker bookings:', snookerError);
    }

    // Fetch Workspace Bookings for the day
    const { data: workspaceBookings, error: workspaceError } = await supabase
      .from('workspace_seat_booking_orders')
      .select('workspace_order_id, total_order_value, order_status')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (workspaceError) {
      console.error('Error fetching workspace bookings:', workspaceError);
    }

    // Calculate totals and status breakdowns for Food Orders
    const foodStatusBreakdown = {
      delivered: { count: 0, total: 0, orderIds: [] as string[] },
      paid: { count: 0, total: 0, orderIds: [] as string[] },
      unpaid: { count: 0, total: 0, orderIds: [] as string[] },
    };
    
    (foodOrders || []).forEach(order => {
      const amount = parseFloat(order.total_amount?.toString() || '0') || 0;
      const status = (order.status || '').toLowerCase();
      const orderId = order.id;
      
      if (status === 'delivered') {
        foodStatusBreakdown.delivered.count++;
        foodStatusBreakdown.delivered.total += amount;
        foodStatusBreakdown.delivered.orderIds.push(orderId);
      } else if (status === 'paid') {
        foodStatusBreakdown.paid.count++;
        foodStatusBreakdown.paid.total += amount;
        foodStatusBreakdown.paid.orderIds.push(orderId);
      } else if (status === 'unpaid' || status === 'received') {
        foodStatusBreakdown.unpaid.count++;
        foodStatusBreakdown.unpaid.total += amount;
        foodStatusBreakdown.unpaid.orderIds.push(orderId);
      }
    });

    const foodTotal = foodStatusBreakdown.delivered.total + foodStatusBreakdown.paid.total + foodStatusBreakdown.unpaid.total;

    // Calculate totals and status breakdowns for Snooker Bookings
    const snookerStatusBreakdown = {
      delivered: { count: 0, total: 0, orderIds: [] as string[] },
      paid: { count: 0, total: 0, orderIds: [] as string[] },
      unpaid: { count: 0, total: 0, orderIds: [] as string[] },
    };
    
    (snookerBookings || []).forEach(booking => {
      const amount = parseFloat(booking.total_order_amount?.toString() || '0') || 0;
      const status = (booking.order_status || '').toLowerCase();
      const orderId = booking.snooker_order_id;
      
      // Map snooker statuses to our categories
      if (status === 'ended') {
        snookerStatusBreakdown.delivered.count++;
        snookerStatusBreakdown.delivered.total += amount;
        snookerStatusBreakdown.delivered.orderIds.push(orderId);
      } else if (status === 'paid') {
        snookerStatusBreakdown.paid.count++;
        snookerStatusBreakdown.paid.total += amount;
        snookerStatusBreakdown.paid.orderIds.push(orderId);
      } else {
        // received, accepted, started, paused, resumed are considered unpaid
        snookerStatusBreakdown.unpaid.count++;
        snookerStatusBreakdown.unpaid.total += amount;
        snookerStatusBreakdown.unpaid.orderIds.push(orderId);
      }
    });

    const snookerTotal = snookerStatusBreakdown.delivered.total + snookerStatusBreakdown.paid.total + snookerStatusBreakdown.unpaid.total;

    // Calculate totals and status breakdowns for Workspace Bookings
    const workspaceStatusBreakdown = {
      delivered: { count: 0, total: 0, orderIds: [] as string[] },
      paid: { count: 0, total: 0, orderIds: [] as string[] },
      unpaid: { count: 0, total: 0, orderIds: [] as string[] },
    };
    
    (workspaceBookings || []).forEach(booking => {
      const amount = parseFloat(booking.total_order_value?.toString() || '0') || 0;
      const status = (booking.order_status || '').toLowerCase();
      const orderId = booking.workspace_order_id;
      
      if (status === 'delivered' || status === 'pass-delivered') {
        workspaceStatusBreakdown.delivered.count++;
        workspaceStatusBreakdown.delivered.total += amount;
        workspaceStatusBreakdown.delivered.orderIds.push(orderId);
      } else if (status === 'paid') {
        workspaceStatusBreakdown.paid.count++;
        workspaceStatusBreakdown.paid.total += amount;
        workspaceStatusBreakdown.paid.orderIds.push(orderId);
      } else {
        // received, accepted are considered unpaid
        workspaceStatusBreakdown.unpaid.count++;
        workspaceStatusBreakdown.unpaid.total += amount;
        workspaceStatusBreakdown.unpaid.orderIds.push(orderId);
      }
    });

    const workspaceTotal = workspaceStatusBreakdown.delivered.total + workspaceStatusBreakdown.paid.total + workspaceStatusBreakdown.unpaid.total;
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

