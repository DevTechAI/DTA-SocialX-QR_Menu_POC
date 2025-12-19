import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { AuthService } from '@/services/AuthService';

export const dynamic = 'force-dynamic';

// GET - Fetch all snooker boards (for admin)
export async function GET() {
  try {
    const authService = new AuthService();
    try {
      await authService.requireRole('manager');
    } catch (error: any) {
      return NextResponse.json({ error: error.message || 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceClient();
    
    const { data, error } = await supabase
      .from('snooker_board_menu_items')
      .select('snooker_board_id, board_name, type, unit_duration, unit_duration_price')
      .order('board_name', { ascending: true });

    if (error) {
      console.error('Error fetching snooker boards:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to fetch snooker boards' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('Unexpected error in GET:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - Update snooker board unit_duration and unit_duration_price
export async function PATCH(request: NextRequest) {
  try {
    const authService = new AuthService();
    try {
      await authService.requireRole('manager');
    } catch (error: any) {
      return NextResponse.json({ error: error.message || 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { snooker_board_id, unit_duration, unit_duration_price } = body;

    if (!snooker_board_id) {
      return NextResponse.json(
        { error: 'snooker_board_id is required' },
        { status: 400 }
      );
    }

    if (unit_duration === undefined && unit_duration_price === undefined) {
      return NextResponse.json(
        { error: 'At least one field (unit_duration or unit_duration_price) must be provided' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();
    
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (unit_duration !== undefined) {
      updateData.unit_duration = unit_duration;
    }
    if (unit_duration_price !== undefined) {
      updateData.unit_duration_price = unit_duration_price;
    }

    const { data, error } = await supabase
      .from('snooker_board_menu_items')
      .update(updateData)
      .eq('snooker_board_id', snooker_board_id)
      .select();

    if (error) {
      console.error('Error updating snooker board:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to update snooker board' },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: `Snooker board with id '${snooker_board_id}' not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: data[0] });
  } catch (error: any) {
    console.error('Unexpected error in PATCH:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

