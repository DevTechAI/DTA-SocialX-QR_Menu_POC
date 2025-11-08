import { NextRequest, NextResponse } from 'next/server';
import { OrderService } from '@/services/OrderService';
import { getMockOrders, addMockOrder } from '@/lib/mock/orders';

export async function GET(request: NextRequest) {
  try {
    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    // Use mock data if Supabase not configured
    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder')) {
      console.log('📋 Using mock data (Supabase not configured)');
      return NextResponse.json(getMockOrders());
    }

    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date');
    const customerName = searchParams.get('customer_name');

    const orderService = new OrderService();
    
    let orders;
    if (date) {
      orders = await orderService.getOrdersByDate(new Date(date));
    } else if (customerName) {
      orders = await orderService.getOrderHistory(customerName);
    } else {
      orders = await orderService.getAllOrders();
    }

    return NextResponse.json(orders);
  } catch (error: any) {
    console.error('Error fetching orders, using mock data:', error);
    return NextResponse.json(getMockOrders());
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customer_name, items, total_amount, table_number } = body;

    // Validate required fields
    if (!customer_name || !items || !total_amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    // Use mock data if Supabase not configured
    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder')) {
      console.log('📝 Adding order to mock data (Supabase not configured)');
      const newOrder = addMockOrder({
        customer_name,
        items,
        total_amount,
        status: 'received',
        table_number,
      });
      return NextResponse.json(newOrder, { status: 201 });
    }

    const orderService = new OrderService();
    const order = await orderService.createOrder({
      customer_name,
      items,
      total_amount,
      table_number,
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error: any) {
    console.error('Error creating order:', error);
    // Fallback to mock data
    const { addMockOrder } = await import('@/lib/mock/orders');
    try {
      const newOrder = addMockOrder({
        customer_name: body.customer_name,
        items: body.items,
        total_amount: body.total_amount,
        status: 'received',
        table_number: body.table_number,
      });
      return NextResponse.json(newOrder, { status: 201 });
    } catch {
      return NextResponse.json(
        { error: error.message || 'Internal server error' },
        { status: 500 }
      );
    }
  }
}

