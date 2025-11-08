import { NextRequest, NextResponse } from 'next/server';
import { OrderService } from '@/services/OrderService';
import { AuthService } from '@/services/AuthService';
import { updateMockOrderStatus, getMockOrderById } from '@/lib/mock/orders';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    // Use mock data if Supabase not configured
    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder')) {
      console.log('📄 Getting mock order (Supabase not configured)');
      const order = getMockOrderById(params.id);
      if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }
      return NextResponse.json(order);
    }

    const orderService = new OrderService();
    const order = await orderService.getOrderById(params.id);

    if (!order) {
      // Fallback to mock data
      const mockOrder = getMockOrderById(params.id);
      if (!mockOrder) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }
      return NextResponse.json(mockOrder);
    }

    return NextResponse.json(order);
  } catch (error: any) {
    console.error('Error fetching order:', error);
    // Fallback to mock data
    const mockOrder = getMockOrderById(params.id);
    if (!mockOrder) {
      return NextResponse.json(
        { error: error.message || 'Internal server error' },
        { status: 500 }
      );
    }
    return NextResponse.json(mockOrder);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    // Use mock data if Supabase not configured
    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder')) {
      console.log('✏️ Updating mock order status (Supabase not configured)');
      const updatedOrder = updateMockOrderStatus(params.id, status);
      if (!updatedOrder) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }
      return NextResponse.json(updatedOrder);
    }

    // Require manager role for updating orders
    try {
      const authService = new AuthService();
      await authService.requireRole('manager');
    } catch (authError: any) {
      if (authError.message.includes('Unauthorized')) {
        return NextResponse.json({ error: authError.message }, { status: 401 });
      }
    }

    const orderService = new OrderService();
    const order = await orderService.updateOrderStatus(params.id, status);

    return NextResponse.json(order);
  } catch (error: any) {
    console.error('Error updating order:', error);
    // Fallback to mock data
    const updatedOrder = updateMockOrderStatus(params.id, body.status);
    if (!updatedOrder) {
      return NextResponse.json(
        { error: error.message || 'Internal server error' },
        { status: 500 }
      );
    }
    return NextResponse.json(updatedOrder);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder')) {
      return NextResponse.json(
        { error: 'Supabase not configured. Cannot delete orders.' },
        { status: 503 }
      );
    }

    const authService = new AuthService();
    await authService.requireRole('manager');

    const orderService = new OrderService();
    await orderService.deleteOrder(params.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: error.message || 'Failed to delete order' },
      { status: 500 }
    );
  }
}

