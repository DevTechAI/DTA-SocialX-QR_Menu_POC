import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/orders/unpaid-by-phone?phone=+91XXXXXXXXXX
 * Retrieves all unpaid orders for a given phone number within the current business day
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');

    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Calculate business day window (8 AM IST to 8 AM IST next day)
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in milliseconds
    const nowUTC = new Date();
    const nowIST = new Date(nowUTC.getTime() + IST_OFFSET_MS);
    
    const istYear = nowIST.getUTCFullYear();
    const istMonth = nowIST.getUTCMonth();
    const istDate = nowIST.getUTCDate();
    const istHours = nowIST.getUTCHours();
    
    // Calculate 8 AM IST today in UTC (8 AM IST = 2:30 AM UTC)
    const startOfBusinessDayUTC = new Date(Date.UTC(istYear, istMonth, istDate, 2, 30, 0, 0));
    
    // Calculate 8 AM IST tomorrow in UTC
    const endOfBusinessDayUTC = new Date(Date.UTC(istYear, istMonth, istDate + 1, 2, 30, 0, 0));
    
    // If current time is before 8 AM IST, use yesterday's 8 AM IST to today's 8 AM IST
    if (istHours < 8) {
      const yesterdayIST = new Date(Date.UTC(istYear, istMonth, istDate - 1, 2, 30, 0, 0));
      startOfBusinessDayUTC.setTime(yesterdayIST.getTime());
      endOfBusinessDayUTC.setTime(startOfBusinessDayUTC.getTime() + (24 * 60 * 60 * 1000));
    }

    // Fetch all unpaid orders for this phone number within business day
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_phno', phone)
      .in('status', ['received', 'unpaid', 'Received', 'Unpaid'])
      .gte('created_at', startOfBusinessDayUTC.toISOString())
      .lt('created_at', endOfBusinessDayUTC.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Supabase error fetching unpaid orders by phone:', error);
      return NextResponse.json(
        { error: `Failed to fetch orders: ${error.message}` },
        { status: 500 }
      );
    }

    // Parse items for each order
    const orders = (data || []).map(order => {
      const phoneNumber = order.customer_phno || order.customer_phNo || 'N/A';
      return {
        ...order,
        customer_phno: phoneNumber,
        items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items,
      };
    });

    // Calculate total amount across all unpaid orders
    const totalAmount = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);

    console.log(`✅ Fetched ${orders.length} unpaid orders for phone: ${phone}, Total: ₹${totalAmount}`);
    
    return NextResponse.json({
      orders,
      totalAmount,
      orderIds: orders.map(o => o.id),
      count: orders.length,
    }, { status: 200 });
  } catch (error: any) {
    console.error('❌ Error fetching unpaid orders by phone:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

