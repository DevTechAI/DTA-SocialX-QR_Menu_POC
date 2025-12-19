import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Mark route as dynamic since it uses cookies via Supabase client
export const dynamic = 'force-dynamic';

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
    const { data, error } = await supabase
      .from('snooker_board_menu_items')
      .select('snooker_board_id, board_name, type, unit_duration, unit_duration_price')
      .order('board_name', { ascending: true });

    if (error) {
      console.error('❌ Supabase error fetching boards:', error);
      return NextResponse.json(
        { error: `Failed to fetch boards: ${error.message}` },
        { status: 500 }
      );
    }

    console.log(`✅ Fetched ${data?.length || 0} boards from Supabase`);
    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error('❌ Error fetching boards:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
