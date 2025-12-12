import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { AuthService } from '@/services/AuthService';

export const dynamic = 'force-dynamic';

// GET - Fetch all feature controls
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
      .from('admin_feature_control')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching feature controls:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to fetch feature controls' },
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

// PATCH - Update feature control
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
    const { feature_item_id, user_visibility, admin_dashboard_visibility } = body;

    if (!feature_item_id) {
      return NextResponse.json(
        { error: 'feature_item_id is required' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();
    
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (user_visibility !== undefined) {
      updateData.user_visibility = user_visibility;
    }

    if (admin_dashboard_visibility !== undefined) {
      updateData.admin_dashboard_visibility = admin_dashboard_visibility;
    }

    const { data, error } = await supabase
      .from('admin_feature_control')
      .update(updateData)
      .eq('feature_item_id', feature_item_id)
      .select();

    if (error) {
      console.error('Error updating feature control:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to update feature control' },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: `Feature control with id '${feature_item_id}' not found` },
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

