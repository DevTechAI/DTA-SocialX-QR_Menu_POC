import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const currentTimestamp = new Date().toISOString();

    // First, get the booking to find the board_id
    const { data: booking, error: fetchError } = await supabase
      .from('snooker_booking_orders')
      .select('snooker_board_id, order_status')
      .eq('snooker_order_id', params.id)
      .single();

    if (fetchError || !booking) {
      console.error('❌ Error fetching booking:', fetchError);
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    console.log('📋 Booking found:', {
      booking_id: params.id,
      snooker_board_id: booking.snooker_board_id,
      order_status: booking.order_status
    });

    // Update the booking order - set start_date_time and update status to Started
    const { data: updatedBooking, error: bookingUpdateError } = await supabase
      .from('snooker_booking_orders')
      .update({
        start_date_time: currentTimestamp,
        order_status: 'Started',
        updated_at: currentTimestamp,
      })
      .eq('snooker_order_id', params.id)
      .select()
      .single();

    if (bookingUpdateError) {
      console.error('❌ Error updating booking:', bookingUpdateError);
      return NextResponse.json(
        { error: `Failed to update booking: ${bookingUpdateError.message}` },
        { status: 500 }
      );
    }

    // Update the board status to STARTED and make it unavailable
    console.log('🔄 Updating board status:', {
      table: 'snooker_board_menu_items',
      filter_column: 'snooker_board_id',
      filter_value: booking.snooker_board_id,
      updates: {
        current_status: 'STARTED',
        is_available_to_play: false
      }
    });
    
    const { error: boardUpdateError } = await supabase
      .from('snooker_board_menu_items')
      .update({
        current_status: 'STARTED',
        is_available_to_play: false,
        updated_at: currentTimestamp,
      })
      .eq('snooker_board_id', booking.snooker_board_id);

    if (boardUpdateError) {
      console.error('❌ Error updating board status:', {
        error: boardUpdateError,
        message: boardUpdateError.message,
        details: boardUpdateError.details,
        hint: boardUpdateError.hint,
        code: boardUpdateError.code
      });
      // Note: Booking was updated but board status update failed
      return NextResponse.json(
        { 
          error: `Booking updated but failed to update board status: ${boardUpdateError.message}`,
          booking: updatedBooking,
        },
        { status: 500 }
      );
    }

    console.log('✅ Board status updated successfully');

    console.log(`✅ Started snooker booking: ${params.id}`);
    return NextResponse.json({
      success: true,
      message: 'Play session started successfully',
      booking: updatedBooking,
    });
  } catch (error: any) {
    console.error('❌ Error starting play session:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

