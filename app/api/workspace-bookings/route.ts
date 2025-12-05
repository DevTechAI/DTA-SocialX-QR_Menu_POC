import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { randomUUID } from 'crypto';

// Mark route as dynamic since it uses cookies via Supabase client
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('workspace_seat_booking_orders')
      .select(`
        *,
        workspace_seat_menu_items (
          workspace_seat_id,
          workspace_seat_value
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Supabase error fetching workspace bookings:', error);
      return NextResponse.json(
        { error: `Failed to fetch workspace bookings: ${error.message}` },
        { status: 500 }
      );
    }

    console.log(`✅ Fetched ${data?.length || 0} workspace bookings from Supabase`);
    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error('❌ Error fetching workspace bookings:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();
    
    const { customer_name, customer_phno, workspace_seat_id, seats_count, total_order_value } = body;

    // Validate required fields
    if (!customer_name || !customer_phno || !workspace_seat_id || !seats_count || total_order_value === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: customer_name, customer_phno, workspace_seat_id, seats_count, total_order_value' },
        { status: 400 }
      );
    }

    // Generate UUID for workspace_order_id
    const workspace_order_id = randomUUID();
    
    // Get current date in UTC
    const order_date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    // Insert booking
    const { data, error } = await supabase
      .from('workspace_seat_booking_orders')
      .insert({
        workspace_order_id,
        workspace_seat_id,
        customer_name: customer_name.trim(),
        customer_phno: customer_phno,
        seats_count: parseInt(seats_count),
        total_order_value: parseFloat(total_order_value),
        order_date,
        order_status: 'Received',
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase error creating workspace booking:', error);
      return NextResponse.json(
        { error: `Failed to create booking: ${error.message}` },
        { status: 500 }
      );
    }

    console.log(`✅ Created workspace booking: ${workspace_order_id}`);
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error('❌ Error creating workspace booking:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

