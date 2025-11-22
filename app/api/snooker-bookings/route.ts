import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    // Create the booking order
    const { data: bookingData, error: bookingError } = await supabase
      .from('snooker_booking_orders')
      .insert({
        customer_name,
        customer_phno,
        snooker_board_id,
        order_status: 'Received', // Match the table default value
        start_date_time: currentTimestamp,
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

    // Update the board status to STARTED
    const { error: boardUpdateError } = await supabase
      .from('snooker_board_menu_items')
      .update({
        current_status: 'STARTED',
        is_available_to_play: false,
        updated_at: currentTimestamp,
      })
      .eq('snooker_board_id', snooker_board_id);

    if (boardUpdateError) {
      console.error('❌ Error updating board status:', boardUpdateError);
      // Note: Booking was created but board status update failed
      // You might want to handle this differently (rollback or retry)
      return NextResponse.json(
        { 
          error: `Booking created but failed to update board status: ${boardUpdateError.message}`,
          booking_id: bookingData.snooker_order_id,
        },
        { status: 500 }
      );
    }

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
