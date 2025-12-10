import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const validStatuses = ['PAID', 'UNPAID', 'ACCEPT', 'REJECT'];

export async function PATCH(
  request: NextRequest,
  { params }: { params: { phone: string } }
) {
  try {
    const supabase = createClient();
    const { phone } = params;
    const body = await request.json();
    const { status } = body;

    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Decode phone number from URL
    const decodedPhone = decodeURIComponent(phone);

    // Get customer billing record
    const { data: customerRecord, error: fetchError } = await supabase
      .from('customer_allorders_details')
      .select('latestdate_allorder_json')
      .eq('customer_phno', decodedPhone)
      .single();

    if (fetchError || !customerRecord) {
      return NextResponse.json(
        { error: 'Customer record not found' },
        { status: 404 }
      );
    }

    const latestOrder = customerRecord.latestdate_allorder_json;

    // Update status in customer_allorders_details
    const { error: updateError } = await supabase
      .from('customer_allorders_details')
      .update({
        latestdate_allorder_status: status === 'ACCEPT' ? 'UNPAID' : status,
        updated_at: new Date().toISOString()
      })
      .eq('customer_phno', decodedPhone);

    if (updateError) {
      console.error('❌ Error updating customer billing status:', updateError);
      return NextResponse.json(
        { error: `Failed to update status: ${updateError.message}` },
        { status: 500 }
      );
    }

    // Update individual order statuses based on latestdate_allorder_json
    // Handle comma-separated UUIDs for multiple orders
    if (latestOrder) {
      // Update food orders if exists
      if (latestOrder.FoodOrderUUID) {
        const foodUUIDs = latestOrder.FoodOrderUUID.toString().split(',').filter((u: string) => u.trim() && u.trim() !== 'null');
        if (foodUUIDs.length > 0) {
          const foodStatus = status === 'PAID' ? 'paid' : status === 'ACCEPT' ? 'accepted' : status === 'REJECT' ? 'rejected' : 'unpaid';
          await supabase
            .from('orders')
            .update({ status: foodStatus })
            .in('id', foodUUIDs.map((u: string) => u.trim()));
        }
      }

      // Update workspace orders if exists
      if (latestOrder.WorkSpaceOrderUUID) {
        const workspaceUUIDs = latestOrder.WorkSpaceOrderUUID.toString().split(',').filter((u: string) => u.trim() && u.trim() !== 'null');
        if (workspaceUUIDs.length > 0) {
          const workspaceStatus = status === 'PAID' ? 'Paid' : status === 'ACCEPT' ? 'Accepted' : status === 'REJECT' ? 'Rejected' : 'Received';
          await supabase
            .from('workspace_seat_booking_orders')
            .update({ order_status: workspaceStatus })
            .in('workspace_order_id', workspaceUUIDs.map((u: string) => u.trim()));
        }
      }

      // Update snooker orders if exists
      if (latestOrder.SnookerOrderUUID) {
        const snookerUUIDs = latestOrder.SnookerOrderUUID.toString().split(',').filter((u: string) => u.trim() && u.trim() !== 'null');
        if (snookerUUIDs.length > 0) {
          const snookerStatus = status === 'PAID' ? 'Ended' : status === 'ACCEPT' ? 'Accepted' : status === 'REJECT' ? 'Rejected' : 'Received';
          await supabase
            .from('snooker_booking_orders')
            .update({ order_status: snookerStatus })
            .in('snooker_order_id', snookerUUIDs.map((u: string) => u.trim()));
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('❌ Error updating customer billing status:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

