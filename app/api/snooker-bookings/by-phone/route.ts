import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Mark route as dynamic since it uses cookies via Supabase client
export const dynamic = 'force-dynamic';

/**
 * GET /api/snooker-bookings/by-phone?phone=+91XXXXXXXXXX
 * Retrieves the most recent snooker booking for a given phone number
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

    // Fetch the most recent booking for this phone number
    const { data, error } = await supabase
      .from('snooker_booking_orders')
      .select(`
        *,
        snooker_board_menu_items (
          snooker_board_id,
          board_name,
          type,
          given_duration_for_100inr
        )
      `)
      .eq('customer_phno', phone)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      // If no booking found, return null instead of error
      if (error.code === 'PGRST116') {
        return NextResponse.json({ data: null }, { status: 200 });
      }
      
      console.error('❌ Supabase error fetching snooker booking by phone:', error);
      return NextResponse.json(
        { error: `Failed to fetch booking: ${error.message}` },
        { status: 500 }
      );
    }

    // Check if booking was created within the last 12 hours
    if (data) {
      const bookingTime = new Date(data.created_at).getTime();
      const now = Date.now();
      const twelveHoursInMs = 12 * 60 * 60 * 1000;
      
      if (now - bookingTime > twelveHoursInMs) {
        // Booking is older than 12 hours, return null
        return NextResponse.json({ data: null }, { status: 200 });
      }
    }

    console.log(`✅ Fetched snooker booking for phone: ${phone}`);
    return NextResponse.json({ data }, { status: 200 });
  } catch (error: any) {
    console.error('❌ Error fetching snooker booking by phone:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

