import { NextRequest, NextResponse } from 'next/server';
import { OrderService } from '@/services/OrderService';
import { AuthService } from '@/services/AuthService';
import { MenuService } from '@/services/MenuService';
import { getMockOrders, addMockOrder, clearMockOrders } from '@/lib/mock/orders';

export async function GET(request: NextRequest) {
  try {
    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    // Use mock data if Supabase not configured
    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder')) {
      console.log('📋 Using mock data (Supabase not configured)');
      return NextResponse.json(getMockOrders());
    }

    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date');
    const customerName = searchParams.get('customer_name');
    const businessDay = searchParams.get('business_day'); // New parameter for 8 AM to 8 AM window

    const orderService = new OrderService();
    
    let orders;
    if (businessDay === 'true') {
      // Use business day window (8 AM to 8 AM)
      orders = await orderService.getOrdersByBusinessDay();
    } else if (date) {
      orders = await orderService.getOrdersByDate(new Date(date));
    } else if (customerName) {
      orders = await orderService.getOrderHistory(customerName);
    } else {
      orders = await orderService.getAllOrders();
    }

    return NextResponse.json(orders);
  } catch (error: any) {
    console.error('Error fetching orders, using mock data:', error);
    return NextResponse.json(getMockOrders());
  }
}

export async function POST(request: NextRequest) {
  let customer_name: string | undefined;
  let customer_phno: string | undefined;
  let items: any[] | undefined;
  let total_amount: number | undefined;
  let table_number: string | undefined;

  try {
    const body = await request.json();
    customer_name = body.customer_name;
    // Accept both customer_phNo (from frontend) and customer_phno (from database)
    customer_phno = body.customer_phno || body.customer_phNo;
    items = body.items;
    total_amount = body.total_amount;
    table_number = body.table_number;

    // Validate required fields
    if (!customer_name || !customer_phno || !items || !total_amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    console.log('🔍 Order Creation Debug:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseKey: !!supabaseKey,
      urlContainsPlaceholder: supabaseUrl?.includes('placeholder'),
      urlPreview: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'MISSING',
    });
    
    // Use mock data if Supabase not configured
    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder')) {
      console.log('📝 Adding order to mock data (Supabase not configured)');
      const newOrder = addMockOrder({
        customer_name,
        customer_phNo: customer_phno,
        items,
        total_amount,
        status: 'received',
        table_number,
      });
      return NextResponse.json(newOrder, { status: 201 });
    }

    console.log('✅ Supabase configured, proceeding with real database...');

    // Check availability of all items in the order
    console.log('🔍 Checking item availability...', { itemIds: items.map((item: any) => item.menu_item_id) });
    let availabilityMap: Record<string, boolean> = {};
    try {
      const menuService = new MenuService();
      const itemIds = items.map((item: any) => item.menu_item_id);
      availabilityMap = await menuService.checkItemsAvailability(itemIds);
      console.log('✅ Item availability checked:', availabilityMap);
    } catch (availabilityError: any) {
      console.error('⚠️ Error checking availability, assuming all items available:', availabilityError);
      // If availability check fails, assume all items are available and proceed
      // This prevents blocking order creation if menu_items table doesn't exist or has issues
      items.forEach((item: any) => {
        availabilityMap[item.menu_item_id] = true;
      });
    }

    // Add Available flag to each item in the order
    const itemsWithAvailability = items.map((item: any) => {
      const isAvailable = availabilityMap[item.menu_item_id] === true;
      return {
        ...item,
        Available: isAvailable,
      };
    });

    // Check if any items are unavailable
    const unavailableItems = itemsWithAvailability.filter((item: any) => item.Available === false);
    
    if (unavailableItems.length > 0) {
      console.log(`⚠️ Order contains ${unavailableItems.length} unavailable items:`, 
        unavailableItems.map((item: any) => item.name));
      
      // Return response with unavailable items information
      return NextResponse.json({
        error: 'Some items are no longer available',
        unavailableItems: unavailableItems.map((item: any) => ({
          menu_item_id: item.menu_item_id,
          name: item.name,
          Available: false,
        })),
        items: itemsWithAvailability, // Include all items with availability status
      }, { status: 400 }); // 400 Bad Request - client needs to fix the order
    }

    // All items are available, proceed with order creation
    console.log('📦 Creating order in database...', {
      customer_name,
      customer_phno,
      itemsCount: items.length,
      total_amount,
    });
    
    // Check if consolidation is requested
    const consolidateWithExisting = body.consolidate_with_existing === true;
    const existingOrderIds = body.existing_order_ids || [];
    
    const orderService = new OrderService();
    let order;
    
    if (consolidateWithExisting && existingOrderIds.length > 0) {
      // Consolidate with existing unpaid orders
      console.log('🔄 Consolidating order with existing orders:', existingOrderIds);
      order = await orderService.consolidateOrder({
        customer_name,
        customer_phNo: customer_phno,
        items,
        total_amount,
        table_number,
        existingOrderIds,
      });
    } else {
      // Create new order
      order = await orderService.createOrder({
        customer_name,
        customer_phNo: customer_phno,
        items,
        total_amount,
        table_number,
      });
    }

    console.log('✅ Order created successfully in database:', order.id);
    return NextResponse.json(order, { status: 201 });
  } catch (error: any) {
    console.error('❌ Error creating order:', error);
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    // Fallback to mock data only if we have the required fields
    if (customer_name && customer_phno && items && total_amount) {
      try {
      const { addMockOrder } = await import('@/lib/mock/orders');
      const newOrder = addMockOrder({
        customer_name,
        customer_phNo: customer_phno,
        items,
        total_amount,
          status: 'received',
        table_number,
      });
      return NextResponse.json(newOrder, { status: 201 });
      } catch (fallbackError) {
        // If fallback also fails, return error
        return NextResponse.json(
          { error: error.message || 'Internal server error' },
          { status: 500 }
        );
      }
    }
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    // For mock data, just clear it (no auth needed)
    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder')) {
      console.log('🗑️ Clearing all mock orders');
      clearMockOrders();
      return NextResponse.json({ success: true, message: 'All orders cleared' });
    }

    // Check for bypass cookie (only if explicitly enabled via environment variable)
    const bypassCookie = request.cookies.get('admin_bypass');
    const allowBypass = process.env.ALLOW_ADMIN_BYPASS === 'true';
    
    if (allowBypass && bypassCookie?.value === 'true') {
      console.log('🗑️ ⚠️ Bypass mode enabled - clearing all orders');
      const orderService = new OrderService();
      await orderService.deleteAllOrders();
      return NextResponse.json({ success: true, message: 'All orders cleared' });
    }

    // Require manager role for deleting all orders (if not bypassed)
    const authService = new AuthService();
    await authService.requireRole('manager');

    const orderService = new OrderService();
    await orderService.deleteAllOrders();

    return NextResponse.json({ success: true, message: 'All orders cleared' });
  } catch (error: any) {
    if (error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('Error deleting all orders:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete all orders' },
      { status: 500 }
    );
  }
}

