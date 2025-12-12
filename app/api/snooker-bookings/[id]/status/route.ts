import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const body = await request.json();
    const { order_status } = body;
    const { id } = params;

    if (!order_status) {
      return NextResponse.json(
        { error: 'order_status is required' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['Received', 'Accepted', 'Started', 'Paused', 'Resumed', 'Ended'];
    if (!validStatuses.includes(order_status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Update booking status
    const { data, error } = await supabase
      .from('snooker_booking_orders')
      .update({ order_status })
      .eq('snooker_order_id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase error updating snooker booking status:', error);
      return NextResponse.json(
        { error: `Failed to update booking status: ${error.message}` },
        { status: 500 }
      );
    }

    console.log(`✅ Updated snooker booking ${id} status to ${order_status}`);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('❌ Error updating snooker booking status:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

