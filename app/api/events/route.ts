import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder')) {
      return NextResponse.json(
        { error: 'Database is not configured.' },
        { status: 500 }
      );
    }

    const supabase = createClient();
    
    // Fetch all events, ordered by datetime (upcoming first)
    const { data, error } = await supabase
      .from('floor_events')
      .select('event_uuid, event_name, event_datetime, event_organiser_name, event_organiser_ph')
      .order('event_datetime', { ascending: true });

    if (error) {
      console.error('❌ Supabase error fetching events:', error);
      return NextResponse.json(
        { error: `Failed to fetch events: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(data || [], { status: 200 });
  } catch (error: any) {
    console.error('❌ Error fetching events:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
