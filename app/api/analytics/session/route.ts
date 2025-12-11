import { NextRequest, NextResponse } from 'next/server';
import { createAnonymousClient } from '@/lib/supabase/anonymous';

export async function PATCH(request: NextRequest) {
  try {
    // Use anonymous client with RLS policies for analytics data collection
    // RLS policies should allow anonymous updates (see supabase/analytics-rls-policies.sql)
    const supabase = createAnonymousClient();
    const body = await request.json();

    const { sessionId, orderId, customerPhone, customerName, completedOrder } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing sessionId' },
        { status: 400 }
      );
    }

    const updateData: any = {
      last_activity_at: new Date().toISOString(),
    };

    if (orderId) updateData.order_id = orderId;
    if (customerPhone) updateData.customer_phone = customerPhone;
    if (customerName) updateData.customer_name = customerName;
    if (completedOrder !== undefined) updateData.completed_order = completedOrder;

    // Calculate session duration
    const { data: session } = await supabase
      .from('user_sessions')
      .select('first_visit_at')
      .eq('session_id', sessionId)
      .single();

    if (session) {
      const sessionDuration = Math.floor(
        (Date.now() - new Date(session.first_visit_at).getTime()) / 1000
      );
      updateData.session_duration_seconds = sessionDuration;
    }

    const { error } = await supabase
      .from('user_sessions')
      .update(updateData)
      .eq('session_id', sessionId);

    if (error) throw error;

    // Update flow analytics if order completed
    if (completedOrder) {
      await supabase
        .from('user_flow_analytics')
        .update({
          order_completed: true,
          conversion_funnel_step: 'order_placed',
        })
        .eq('session_id', sessionId);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update session' },
      { status: 500 }
    );
  }
}

