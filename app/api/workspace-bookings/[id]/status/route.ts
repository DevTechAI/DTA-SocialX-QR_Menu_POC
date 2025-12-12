import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Mark route as dynamic since it uses cookies via Supabase client
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
    const validStatuses = ['Received', 'Accepted', 'Paid', 'Delivered', 'Rejected'];
    if (!validStatuses.includes(order_status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Update booking status
    const { data, error } = await supabase
      .from('workspace_seat_booking_orders')
      .update({ order_status })
      .eq('workspace_order_id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase error updating workspace booking status:', error);
      return NextResponse.json(
        { error: `Failed to update booking status: ${error.message}` },
        { status: 500 }
      );
    }

    console.log(`✅ Updated workspace booking ${id} status to ${order_status}`);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('❌ Error updating workspace booking status:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

