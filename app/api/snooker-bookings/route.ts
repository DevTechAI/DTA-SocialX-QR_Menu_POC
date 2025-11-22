import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder')) {
      console.error('❌ Supabase is not configured');
      return NextResponse.json(
        { error: 'Database is not configured. Please set up Supabase environment variables.' },
        { status: 500 }
      );
    }

    const supabase = createClient();
    
    // Fetch all snooker bookings
    const { data: bookings, error: bookingsError } = await supabase
      .from('snooker_booking_orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (bookingsError) {
      console.error('❌ Supabase error fetching snooker bookings:', bookingsError);
      return NextResponse.json(
        { error: `Failed to fetch snooker bookings: ${bookingsError.message}` },
        { status: 500 }
      );
    }

    // Fetch board information for each booking
    const boardIds = [...new Set(bookings?.map(b => b.snooker_board_id) || [])];
    const { data: boards, error: boardsError } = await supabase
      .from('snooker_board_menu_items')
      .select('snooker_board_id, board_name, type, given_duration_for_100inr')
      .in('snooker_board_id', boardIds);

    if (boardsError) {
      console.error('❌ Supabase error fetching boards:', boardsError);
      // Continue without board info
    }

    // Combine bookings with board information
    const data = bookings?.map(booking => ({
      ...booking,
      snooker_board_menu_items: boards?.find(b => b.snooker_board_id === booking.snooker_board_id) || null,
    })) || [];

    console.log(`✅ Fetched ${data?.length || 0} snooker bookings from Supabase`);
    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error('❌ Error fetching snooker bookings:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder')) {
      console.error('❌ Supabase is not configured');
      return NextResponse.json(
        { error: 'Database is not configured. Please set up Supabase environment variables.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { customer_name, customer_phno, snooker_board_id, players_count } = body;

    // Validate required fields
    if (!customer_name || !customer_phno || !snooker_board_id) {
      return NextResponse.json(
        { error: 'Missing required fields: customer_name, customer_phno, snooker_board_id' },
        { status: 400 }
      );
    }

    const supabase = createClient();
    const currentTimestamp = new Date().toISOString();

    // First, ensure customer exists in customer_details table (required by foreign key)
    const { error: customerError } = await supabase
      .from('customer_details')
      .upsert({
        customer_phno,
        customer_name,
        max_order_value: 0,
        total_ordered_value_at_socialx: 0,
      }, {
        onConflict: 'customer_phno',
      });

    if (customerError) {
      console.error('❌ Error creating/updating customer:', customerError);
      return NextResponse.json(
        { error: `Failed to create customer record: ${customerError.message}` },
        { status: 500 }
      );
    }

    // Create the booking order - set status to 'Received' (admin will start play manually)
    const { data: bookingData, error: bookingError } = await supabase
      .from('snooker_booking_orders')
      .insert({
        customer_name,
        customer_phno,
        snooker_board_id,
        order_status: 'Received', // Admin will start play manually
        players_count: players_count ? parseInt(players_count) : 0, // Use 0 as default instead of null
      })
      .select()
      .single();

    if (bookingError) {
      console.error('❌ Error creating booking:', bookingError);
      return NextResponse.json(
        { error: `Failed to create booking: ${bookingError.message}` },
        { status: 500 }
      );
    }

    // Don't update board status on booking creation - admin will start play manually
    // Board remains available until admin clicks "START PLAY"

    console.log(`✅ Created snooker booking: ${bookingData.snooker_order_id}`);
    return NextResponse.json({
      success: true,
      message: 'Booking created successfully',
      booking_id: bookingData.snooker_order_id,
      booking: bookingData,
    });
  } catch (error: any) {
    console.error('❌ Error in booking creation:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
