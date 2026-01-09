import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder')) {
      return NextResponse.json(
        { error: 'Database is not configured.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { event_uuid, attendee_name, attendee_phno, notify_future_events } = body;

    // Validate required fields
    if (!event_uuid || !attendee_name || !attendee_phno) {
      return NextResponse.json(
        { error: 'Missing required fields: event_uuid, attendee_name, attendee_phno' },
        { status: 400 }
      );
    }

    // Default notify_future_events to false if not provided
    const notifyFutureEvents = notify_future_events === true || notify_future_events === 'true';

    // Validate phone number format (should be 10 digits or with +91)
    const phoneDigits = attendee_phno.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    const supabase = createClient();
    
    // Format phone number with +91 prefix
    const formattedPhone = phoneDigits.startsWith('91') && phoneDigits.length === 12
      ? `+${phoneDigits}`
      : phoneDigits.length === 10
      ? `+91${phoneDigits}`
      : attendee_phno;

    // Check if event exists
    const { data: event, error: eventError } = await supabase
      .from('floor_events')
      .select('event_uuid, event_name')
      .eq('event_uuid', event_uuid)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Check if already checked in (upsert behavior - update if exists, insert if not)
    const { data: existingCheckIn } = await supabase
      .from('event_attendees')
      .select('*')
      .eq('event_uuid', event_uuid)
      .eq('attendee_phno', formattedPhone)
      .single();

    if (existingCheckIn) {
      // Already checked in - return existing check-in with updated time
      const { data: updatedCheckIn, error: updateError } = await supabase
        .from('event_attendees')
        .update({ 
          attendee_name: attendee_name.trim(),
          check_in_time: new Date().toISOString(),
          notify_future_events: notifyFutureEvents
        })
        .eq('event_uuid', event_uuid)
        .eq('attendee_phno', formattedPhone)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Error updating check-in:', updateError);
        return NextResponse.json(
          { error: `Failed to update check-in: ${updateError.message}` },
          { status: 500 }
        );
      }

      return NextResponse.json({
        check_in_id: `${event_uuid}-${formattedPhone}`,
        event_uuid: event_uuid,
        event_name: event.event_name,
        attendee_name: updatedCheckIn.attendee_name,
        attendee_phno: formattedPhone,
        check_in_time: updatedCheckIn.check_in_time,
        is_duplicate: true
      }, { status: 200 });
    }

    // Insert new check-in
    const { data: checkIn, error: insertError } = await supabase
      .from('event_attendees')
      .insert({
        event_uuid: event_uuid,
        attendee_name: attendee_name.trim(),
        attendee_phno: formattedPhone,
        check_in_time: new Date().toISOString(),
        notify_future_events: notifyFutureEvents
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Supabase error creating check-in:', insertError);
      return NextResponse.json(
        { error: `Failed to create check-in: ${insertError.message}` },
        { status: 500 }
      );
    }

    console.log(`✅ Created event check-in: ${event_uuid} - ${formattedPhone}`);
    return NextResponse.json({
      check_in_id: `${event_uuid}-${formattedPhone}`,
      event_uuid: event_uuid,
      event_name: event.event_name,
      attendee_name: checkIn.attendee_name,
      attendee_phno: formattedPhone,
      check_in_time: checkIn.check_in_time,
      is_duplicate: false
    }, { status: 201 });
  } catch (error: any) {
    console.error('❌ Error creating event check-in:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
