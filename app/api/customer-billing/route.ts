import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('customer_allorders_details')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('❌ Supabase error fetching customer billing:', error);
      return NextResponse.json(
        { error: `Failed to fetch customer billing: ${error.message}` },
        { status: 500 }
      );
    }

    // Enhance each billing record with detailed order information
    const enhancedData = await Promise.all(
      (data || []).map(async (billing) => {
        const enhancedBilling = { ...billing };
        
        // Process order_history_json to add detailed information
        if (billing.order_history_json && Array.isArray(billing.order_history_json)) {
          enhancedBilling.order_history_json = await Promise.all(
            billing.order_history_json.map(async (orderHistory: any) => {
              const enhancedHistory = { ...orderHistory };
              
              // Fetch Food Order details
              if (orderHistory.FoodOrderUUID) {
                const foodUUIDs = orderHistory.FoodOrderUUID.toString().split(',').filter((u: string) => u.trim() && u.trim() !== 'null');
                if (foodUUIDs.length > 0) {
                  const { data: foodOrders, error: foodError } = await supabase
                    .from('orders')
                    .select('id, customer_name, items, total_amount, status, created_at')
                    .in('id', foodUUIDs.map((u: string) => u.trim()));
                  
                  if (!foodError && foodOrders) {
                    enhancedHistory.foodOrders = foodOrders.map(order => ({
                      id: order.id,
                      customer_name: order.customer_name,
                      items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items,
                      total_amount: order.total_amount,
                      status: order.status,
                      created_at: order.created_at,
                    }));
                  }
                }
              }
              
              // Fetch Snooker Booking details
              if (orderHistory.SnookerOrderUUID) {
                const snookerUUIDs = orderHistory.SnookerOrderUUID.toString().split(',').filter((u: string) => u.trim() && u.trim() !== 'null');
                if (snookerUUIDs.length > 0) {
                  const { data: snookerBookings, error: snookerError } = await supabase
                    .from('snooker_booking_orders')
                    .select(`
                      snooker_order_id,
                      customer_name,
                      snooker_board_id,
                      order_status,
                      start_date_time,
                      end_date_time,
                      total_duration_minutes,
                      total_order_amount,
                      players_count,
                      created_at,
                      snooker_board_menu_items (
                        board_name,
                        type,
                        given_duration_for_100inr
                      )
                    `)
                    .in('snooker_order_id', snookerUUIDs.map((u: string) => u.trim()));
                  
                  if (!snookerError && snookerBookings) {
                    enhancedHistory.snookerBookings = snookerBookings;
                  }
                }
              }
              
              // Fetch Workspace Booking details
              if (orderHistory.WorkSpaceOrderUUID) {
                const workspaceUUIDs = orderHistory.WorkSpaceOrderUUID.toString().split(',').filter((u: string) => u.trim() && u.trim() !== 'null');
                if (workspaceUUIDs.length > 0) {
                  const { data: workspaceBookings, error: workspaceError } = await supabase
                    .from('workspace_seat_booking_orders')
                    .select(`
                      workspace_order_id,
                      customer_name,
                      workspace_seat_id,
                      seats_count,
                      total_order_value,
                      order_status,
                      order_date,
                      created_at,
                      workspace_seat_menu_items (
                        workspace_seat_id,
                        workspace_seat_value
                      )
                    `)
                    .in('workspace_order_id', workspaceUUIDs.map((u: string) => u.trim()));
                  
                  if (!workspaceError && workspaceBookings) {
                    enhancedHistory.workspaceBookings = workspaceBookings;
                  }
                }
              }
              
              return enhancedHistory;
            })
          );
        }
        
        // Also enhance latestdate_allorder_json
        if (billing.latestdate_allorder_json && typeof billing.latestdate_allorder_json === 'object') {
          const latestOrder = { ...billing.latestdate_allorder_json };
          
          // Fetch Food Order details for latest order
          if (latestOrder.FoodOrderUUID) {
            const foodUUIDs = latestOrder.FoodOrderUUID.toString().split(',').filter((u: string) => u.trim() && u.trim() !== 'null');
            if (foodUUIDs.length > 0) {
              const { data: foodOrders, error: foodError } = await supabase
                .from('orders')
                .select('id, customer_name, items, total_amount, status, created_at')
                .in('id', foodUUIDs.map((u: string) => u.trim()));
              
              if (!foodError && foodOrders) {
                latestOrder.foodOrders = foodOrders.map(order => ({
                  id: order.id,
                  customer_name: order.customer_name,
                  items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items,
                  total_amount: order.total_amount,
                  status: order.status,
                  created_at: order.created_at,
                }));
              }
            }
          }
          
          // Fetch Snooker Booking details for latest order
          if (latestOrder.SnookerOrderUUID) {
            const snookerUUIDs = latestOrder.SnookerOrderUUID.toString().split(',').filter((u: string) => u.trim() && u.trim() !== 'null');
            if (snookerUUIDs.length > 0) {
              const { data: snookerBookings, error: snookerError } = await supabase
                .from('snooker_booking_orders')
                .select(`
                  snooker_order_id,
                  customer_name,
                  snooker_board_id,
                  order_status,
                  start_date_time,
                  end_date_time,
                  total_duration_minutes,
                  total_order_amount,
                  players_count,
                  created_at,
                  snooker_board_menu_items (
                    board_name,
                    type,
                    given_duration_for_100inr
                  )
                `)
                .in('snooker_order_id', snookerUUIDs.map((u: string) => u.trim()));
              
              if (!snookerError && snookerBookings) {
                latestOrder.snookerBookings = snookerBookings;
              }
            }
          }
          
          // Fetch Workspace Booking details for latest order
          if (latestOrder.WorkSpaceOrderUUID) {
            const workspaceUUIDs = latestOrder.WorkSpaceOrderUUID.toString().split(',').filter((u: string) => u.trim() && u.trim() !== 'null');
            if (workspaceUUIDs.length > 0) {
              const { data: workspaceBookings, error: workspaceError } = await supabase
                .from('workspace_seat_booking_orders')
                .select(`
                  workspace_order_id,
                  customer_name,
                  workspace_seat_id,
                  seats_count,
                  total_order_value,
                  order_status,
                  order_date,
                  created_at,
                  workspace_seat_menu_items (
                    workspace_seat_id,
                    workspace_seat_value
                  )
                `)
                .in('workspace_order_id', workspaceUUIDs.map((u: string) => u.trim()));
              
              if (!workspaceError && workspaceBookings) {
                latestOrder.workspaceBookings = workspaceBookings;
              }
            }
          }
          
          enhancedBilling.latestdate_allorder_json = latestOrder;
        }
        
        return enhancedBilling;
      })
    );

    console.log(`✅ Fetched and enhanced ${enhancedData?.length || 0} customer billing records`);
    return NextResponse.json(enhancedData || []);
  } catch (error: any) {
    console.error('❌ Error fetching customer billing:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

