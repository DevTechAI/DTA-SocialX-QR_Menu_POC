import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { phone: string } }
) {
  try {
    const supabase = createClient();
    const { phone } = params;
    const body = await request.json();
    const { orderType, orderId, status } = body;

    if (!orderType || !orderId || !status) {
      return NextResponse.json(
        { error: 'orderType, orderId, and status are required' },
        { status: 400 }
      );
    }

    // Decode phone number from URL
    const decodedPhone = decodeURIComponent(phone);

    // Update individual order status based on type
    let updateError = null;
    
    if (orderType === 'food') {
      const foodStatus = status === 'PAID' ? 'paid' : 'unpaid';
      const { error } = await supabase
        .from('orders')
        .update({ status: foodStatus })
        .eq('id', orderId);
      updateError = error;
    } else if (orderType === 'workspace') {
      const workspaceStatus = status === 'PAID' ? 'Paid' : status === 'UNPAID' ? 'Received' : status;
      const { error } = await supabase
        .from('workspace_seat_booking_orders')
        .update({ order_status: workspaceStatus })
        .eq('workspace_order_id', orderId);
      updateError = error;
    } else if (orderType === 'snooker') {
      // For snooker, PAID means 'Ended', UNPAID means 'Received' or other statuses
      const snookerStatus = status === 'PAID' ? 'Ended' : status === 'UNPAID' ? 'Received' : status;
      const { error } = await supabase
        .from('snooker_booking_orders')
        .update({ order_status: snookerStatus })
        .eq('snooker_order_id', orderId);
      updateError = error;
    } else {
      return NextResponse.json(
        { error: 'Invalid orderType. Must be: food, workspace, or snooker' },
        { status: 400 }
      );
    }

    if (updateError) {
      console.error('❌ Error updating individual order status:', updateError);
      return NextResponse.json(
        { error: `Failed to update order status: ${updateError.message}` },
        { status: 500 }
      );
    }

    // After updating individual order, check if all orders for this customer are PAID
    // Get customer billing record
    const { data: customerRecord, error: fetchError } = await supabase
      .from('customer_allorders_details')
      .select('latestdate_allorder_json, order_history_json')
      .eq('customer_phno', decodedPhone)
      .single();

    if (fetchError || !customerRecord) {
      // If we can't find customer record, still return success for the order update
      return NextResponse.json({ success: true, mainStatusUpdated: false });
    }

    const latestOrder = customerRecord.latestdate_allorder_json;
    if (!latestOrder) {
      return NextResponse.json({ success: true, mainStatusUpdated: false });
    }

    // Check all orders in latestdate_allorder_json for the latest order date
    let allPaid = true;
    let hasOrders = false;

    // Check food orders
    if (latestOrder.FoodOrderUUID) {
      const foodUUIDs = latestOrder.FoodOrderUUID.toString().split(',').filter((u: string) => u.trim() && u.trim() !== 'null');
      if (foodUUIDs.length > 0) {
        hasOrders = true;
        const { data: foodOrders } = await supabase
          .from('orders')
          .select('status')
          .in('id', foodUUIDs.map((u: string) => u.trim()));
        
        if (foodOrders && foodOrders.length > 0) {
          const allFoodPaid = foodOrders.every((o: any) => o.status === 'paid' || o.status === 'Paid');
          if (!allFoodPaid) allPaid = false;
        }
      }
    }

    // Check workspace orders
    if (latestOrder.WorkSpaceOrderUUID) {
      const workspaceUUIDs = latestOrder.WorkSpaceOrderUUID.toString().split(',').filter((u: string) => u.trim() && u.trim() !== 'null');
      if (workspaceUUIDs.length > 0) {
        hasOrders = true;
        const { data: workspaceOrders } = await supabase
          .from('workspace_seat_booking_orders')
          .select('order_status')
          .in('workspace_order_id', workspaceUUIDs.map((u: string) => u.trim()));
        
        if (workspaceOrders && workspaceOrders.length > 0) {
          const allWorkspacePaid = workspaceOrders.every((o: any) => o.order_status === 'Paid' || o.order_status === 'PAID');
          if (!allWorkspacePaid) allPaid = false;
        }
      }
    }

    // Check snooker orders
    if (latestOrder.SnookerOrderUUID) {
      const snookerUUIDs = latestOrder.SnookerOrderUUID.toString().split(',').filter((u: string) => u.trim() && u.trim() !== 'null');
      if (snookerUUIDs.length > 0) {
        hasOrders = true;
        const { data: snookerOrders } = await supabase
          .from('snooker_booking_orders')
          .select('order_status')
          .in('snooker_order_id', snookerUUIDs.map((u: string) => u.trim()));
        
        if (snookerOrders && snookerOrders.length > 0) {
          const allSnookerPaid = snookerOrders.every((o: any) => o.order_status === 'Ended' || o.order_status === 'ENDED');
          if (!allSnookerPaid) allPaid = false;
        }
      }
    }

    // If all orders are paid and we have orders, update main card status and order_history_json
    if (allPaid && hasOrders) {
      // Update latestdate_allorder_json status
      const updatedLatestOrder = {
        ...latestOrder,
        allOrder_Status: 'PAID'
      };

      // Update order_history_json - find and update the entry for the latest order date
      let updatedOrderHistory = customerRecord.order_history_json || [];
      if (Array.isArray(updatedOrderHistory)) {
        updatedOrderHistory = updatedOrderHistory.map((entry: any) => {
          if (entry.order_date === latestOrder.order_date) {
            return {
              ...entry,
              allOrder_Status: 'PAID'
            };
          }
          return entry;
        });
      }

      const { error: mainUpdateError } = await supabase
        .from('customer_allorders_details')
        .update({
          latestdate_allorder_status: 'PAID',
          latestdate_allorder_json: updatedLatestOrder,
          order_history_json: updatedOrderHistory,
          updated_at: new Date().toISOString()
        })
        .eq('customer_phno', decodedPhone);

      if (mainUpdateError) {
        console.error('❌ Error updating main card status:', mainUpdateError);
        return NextResponse.json({ 
          success: true, 
          mainStatusUpdated: false,
          error: 'Order updated but failed to update main card status'
        });
      }

      return NextResponse.json({ success: true, mainStatusUpdated: true });
    }

    return NextResponse.json({ success: true, mainStatusUpdated: false });
  } catch (error: any) {
    console.error('❌ Error updating individual order status:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

