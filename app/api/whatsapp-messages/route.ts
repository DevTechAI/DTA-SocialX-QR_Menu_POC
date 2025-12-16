import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { AuthService } from '@/services/AuthService';

export const dynamic = 'force-dynamic';

// GET - Fetch WhatsApp messages
export async function GET() {
  try {
    // Check authentication
    const authService = new AuthService();
    try {
      await authService.requireRole('manager');
    } catch (error: any) {
      return NextResponse.json({ error: error.message || 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceClient();
    
    const { data, error } = await supabase
      .from('whatsapp_custom_msgs')
      .select('*')
      .order('msg_id', { ascending: true });

    if (error) {
      console.error('Error fetching WhatsApp messages:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to fetch WhatsApp messages' },
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

// PATCH - Update WhatsApp message
export async function PATCH(request: NextRequest) {
  try {
    // Check authentication
    const authService = new AuthService();
    try {
      await authService.requireRole('manager');
    } catch (error: any) {
      return NextResponse.json({ error: error.message || 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { msg_id, default_msg, custom_msg1, custom_msg2, custom_msg3, custom_msg4, custom_msg5 } = body;

    if (!msg_id) {
      return NextResponse.json(
        { error: 'msg_id is required' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();
    
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (default_msg !== undefined) {
      updateData.default_msg = default_msg;
    }
    if (custom_msg1 !== undefined) {
      updateData.custom_msg1 = custom_msg1;
    }
    if (custom_msg2 !== undefined) {
      updateData.custom_msg2 = custom_msg2;
    }
    if (custom_msg3 !== undefined) {
      updateData.custom_msg3 = custom_msg3;
    }
    if (custom_msg4 !== undefined) {
      updateData.custom_msg4 = custom_msg4;
    }
    if (custom_msg5 !== undefined) {
      updateData.custom_msg5 = custom_msg5;
    }

    const { data, error } = await supabase
      .from('whatsapp_custom_msgs')
      .update(updateData)
      .eq('msg_id', msg_id)
      .select();

    if (error) {
      console.error('Error updating WhatsApp message:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to update WhatsApp message' },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: `WhatsApp message with id '${msg_id}' not found` },
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

