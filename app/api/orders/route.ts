import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getMockOrders } from '@/lib/mock/orders';

export async function GET() {
  try {
    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    // Use mock data if Supabase not configured
    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder')) {
      console.log('📋 Using mock data (Supabase not configured)');
      return NextResponse.json(getMockOrders());
    }

    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error, falling back to mock data:', error);
      return NextResponse.json(getMockOrders());
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error fetching orders, using mock data:', error);
    return NextResponse.json(getMockOrders());
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customer_name, items, total_amount, status = 'received', table_number } = body;

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
      const { addMockOrder } = await import('@/lib/mock/orders');
      const newOrder = addMockOrder({
        customer_name,
        items,
        total_amount,
        status,
        table_number,
      });
      return NextResponse.json(newOrder, { status: 201 });
    }

    const supabase = createClient();
    
    const orderData = {
      customer_name,
      items: JSON.stringify(items),
      total_amount,
      status,
      table_number: table_number || null,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single();

    if (error) {
      console.error('Supabase error, saving to mock data:', error);
      const { addMockOrder } = await import('@/lib/mock/orders');
      const newOrder = addMockOrder({
        customer_name,
        items,
        total_amount,
        status,
        table_number,
      });
      return NextResponse.json(newOrder, { status: 201 });
    }

    // Parse items back to JSON for response
    const responseData = {
      ...data,
      items: JSON.parse(data.items),
    };

    return NextResponse.json(responseData, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

