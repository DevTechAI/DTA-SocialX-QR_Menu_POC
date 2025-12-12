import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

// GET - Fetch feature visibility for public use (no auth required)
export async function GET() {
  try {
    const supabase = createServiceClient();
    
    const { data, error } = await supabase
      .from('admin_feature_control')
      .select('feature_item_id, user_visibility')
      .in('feature_item_id', ['food-order-booking', 'snooker-order-booking', 'seat-order-booking']);

    if (error) {
      console.error('Error fetching feature visibility:', error);
      // Return default values if error (all enabled)
      return NextResponse.json({
        'food-order-booking': true,
        'snooker-order-booking': true,
        'seat-order-booking': true,
      });
    }

    // Convert array to object for easier lookup
    const visibilityMap: Record<string, boolean> = {
      'food-order-booking': true,
      'snooker-order-booking': true,
      'seat-order-booking': true,
    };

    if (data) {
      data.forEach((feature) => {
        visibilityMap[feature.feature_item_id] = feature.user_visibility;
      });
    }

    return NextResponse.json(visibilityMap);
  } catch (error: any) {
    console.error('Unexpected error:', error);
    // Return default values if error (all enabled)
    return NextResponse.json({
      'food-order-booking': true,
      'snooker-order-booking': true,
      'seat-order-booking': true,
    });
  }
}

