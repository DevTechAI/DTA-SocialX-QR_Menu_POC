import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AuthService } from '@/services/AuthService';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const authService = new AuthService();
    try {
      await authService.requireRole('manager');
    } catch (error: any) {
      return NextResponse.json({ error: error.message || 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient();
    
    // Return empty data if tables don't exist yet - this is expected initially
    // The analytics will populate as users interact with the app

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // First, try to get analytics data
    let query = supabase
      .from('user_flow_analytics')
      .select('*');

    if (startDate && endDate) {
      query = query.gte('date', startDate).lte('date', endDate);
    } else {
      query = query.eq('date', date);
    }

    const { data: analytics, error: analyticsError } = await query.order('created_at', { ascending: false });

    // Handle errors gracefully - return empty data structure
    if (analyticsError) {
      console.error('Error fetching analytics:', analyticsError);
      // Return empty stats structure - tables might not exist yet or have no data
      return NextResponse.json({
        analytics: [],
        events: [],
        stats: {
          totalSessions: 0,
          completedOrders: 0,
          conversionRate: '0.00',
          totalPageViews: 0,
          totalButtonClicks: 0,
          totalItemsAdded: 0,
          totalItemsRemoved: 0,
          totalCategoriesExpanded: 0,
          totalImagesClicked: 0,
          totalCheckoutAttempts: 0,
          averageTimeInMenu: 0,
          averageTimeInCheckout: 0,
          avgItemsPerSession: '0.00',
          avgSessionDuration: 0,
          avgEventsPerSession: '0.0',
          cartAbandonmentRate: '0.00',
          bounceRate: '0.00',
          menuToCheckoutRate: '0.00',
          checkoutToOrderRate: '0.00',
          engagementScore: 0,
          dropoffPoints: { menu: 0, nameEntry: 0, orderPlaced: 0 },
          deviceBreakdown: { mobile: 0, tablet: 0, desktop: 0 },
          entryPoints: {},
        },
        mostClickedItems: [],
        mostClickedButtons: [],
        mostExpandedCategories: [],
      });
    }

    // Get session data separately
    const sessionIds = analytics?.map((a: any) => a.session_id) || [];
    let sessionsData: any[] = [];
    
    if (sessionIds.length > 0) {
      const { data: sessions, error: sessionsError } = await supabase
        .from('user_sessions')
        .select('session_id, device_type, entry_point, completed_order, customer_phone, customer_name')
        .in('session_id', sessionIds);
      
      if (sessionsError) {
        console.error('Error fetching sessions:', sessionsError);
        // Continue with empty sessions data
      } else {
        sessionsData = sessions || [];
      }
    }

    // Merge session data with analytics
    const analyticsWithSessions = analytics?.map((a: any) => {
      const session = sessionsData.find((s: any) => s.session_id === a.session_id);
      return {
        ...a,
        user_sessions: session || null,
      };
    }) || [];

    // Get event-level data for detailed analysis
    let eventsData: any[] = [];
    if (sessionIds.length > 0) {
      const { data: events, error: eventsError } = await supabase
        .from('user_interaction_events')
        .select('*')
        .in('session_id', sessionIds)
        .order('timestamp', { ascending: true });

      if (eventsError) {
        console.error('Error fetching events:', eventsError);
        // Continue with empty events data
      } else {
        eventsData = events || [];
      }
    }

    // Aggregate statistics
    const stats = {
      totalSessions: analyticsWithSessions?.length || 0,
      completedOrders: analyticsWithSessions?.filter((a: any) => a.order_completed).length || 0,
      conversionRate: analyticsWithSessions?.length > 0 
        ? (analyticsWithSessions.filter((a: any) => a.order_completed).length / analyticsWithSessions.length * 100).toFixed(2)
        : '0.00',
      totalPageViews: analyticsWithSessions?.reduce((sum: number, a: any) => sum + (a.total_page_views || 0), 0) || 0,
      totalButtonClicks: analyticsWithSessions?.reduce((sum: number, a: any) => sum + (a.total_button_clicks || 0), 0) || 0,
      totalItemsAdded: analyticsWithSessions?.reduce((sum: number, a: any) => sum + (a.total_items_added || 0), 0) || 0,
      averageTimeInMenu: analyticsWithSessions?.length > 0
        ? Math.round(analyticsWithSessions.reduce((sum: number, a: any) => sum + (a.time_in_menu_seconds || 0), 0) / analyticsWithSessions.length)
        : 0,
      averageTimeInCheckout: analyticsWithSessions?.length > 0
        ? Math.round(analyticsWithSessions.reduce((sum: number, a: any) => sum + (a.time_in_nameentry_seconds || 0), 0) / analyticsWithSessions.length)
        : 0,
      dropoffPoints: {
        menu: analyticsWithSessions?.filter((a: any) => a.dropoff_point === 'menu').length || 0,
        nameEntry: analyticsWithSessions?.filter((a: any) => a.dropoff_point === 'nameEntry').length || 0,
        orderPlaced: analyticsWithSessions?.filter((a: any) => a.dropoff_point === 'orderPlaced').length || 0,
      },
      deviceBreakdown: {
        mobile: analyticsWithSessions?.filter((a: any) => a.user_sessions?.device_type === 'mobile').length || 0,
        tablet: analyticsWithSessions?.filter((a: any) => a.user_sessions?.device_type === 'tablet').length || 0,
        desktop: analyticsWithSessions?.filter((a: any) => a.user_sessions?.device_type === 'desktop').length || 0,
      },
    };

    // Most clicked items
    const itemClicks = eventsData
      .filter((e: any) => e.event_type === 'item_add' && e.element_id)
      .reduce((acc: any, e: any) => {
        acc[e.element_id] = (acc[e.element_id] || 0) + 1;
        return acc;
      }, {});

    const mostClickedItems = Object.entries(itemClicks)
      .map(([itemId, count]) => ({ itemId, count }))
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 10);

    // Calculate additional KPIs
    const totalItemsRemoved = analyticsWithSessions?.reduce((sum: number, a: any) => sum + (a.total_items_removed || 0), 0) || 0;
    const totalCategoriesExpanded = analyticsWithSessions?.reduce((sum: number, a: any) => sum + (a.categories_expanded || 0), 0) || 0;
    const totalImagesClicked = analyticsWithSessions?.reduce((sum: number, a: any) => sum + (a.images_clicked || 0), 0) || 0;
    const totalCheckoutAttempts = analyticsWithSessions?.reduce((sum: number, a: any) => sum + (a.checkout_attempts || 0), 0) || 0;
    const totalTimeInOrderPlaced = analyticsWithSessions?.reduce((sum: number, a: any) => sum + (a.time_in_orderplaced_seconds || 0), 0) || 0;
    
    // Calculate averages
    const avgItemsPerSession = analyticsWithSessions?.length > 0 
      ? (stats.totalItemsAdded / analyticsWithSessions.length).toFixed(2)
      : '0.00';
    const avgSessionDuration = analyticsWithSessions?.length > 0
      ? Math.round(analyticsWithSessions.reduce((sum: number, a: any) => {
          return sum + (a.time_in_menu_seconds || 0) + (a.time_in_nameentry_seconds || 0) + (a.time_in_orderplaced_seconds || 0);
        }, 0) / analyticsWithSessions.length)
      : 0;
    const avgEventsPerSession = analyticsWithSessions?.length > 0
      ? (eventsData.length / analyticsWithSessions.length).toFixed(1)
      : '0.0';
    
    // Cart abandonment rate (sessions with items added but no order)
    const sessionsWithItems = analyticsWithSessions?.filter((a: any) => (a.total_items_added || 0) > 0).length || 0;
    const cartAbandonmentRate = sessionsWithItems > 0
      ? (((sessionsWithItems - stats.completedOrders) / sessionsWithItems) * 100).toFixed(2)
      : '0.00';
    
    // Bounce rate (sessions with no interactions)
    const bouncedSessions = analyticsWithSessions?.filter((a: any) => 
      (a.total_button_clicks || 0) === 0 && (a.total_items_added || 0) === 0
    ).length || 0;
    const bounceRate = analyticsWithSessions?.length > 0
      ? ((bouncedSessions / analyticsWithSessions.length) * 100).toFixed(2)
      : '0.00';
    
    // Most clicked buttons
    const buttonClicks = eventsData
      .filter((e: any) => e.event_type === 'button_click' && e.element_name)
      .reduce((acc: any, e: any) => {
        acc[e.element_name] = (acc[e.element_name] || 0) + 1;
        return acc;
      }, {});
    
    const mostClickedButtons = Object.entries(buttonClicks)
      .map(([buttonName, count]) => ({ buttonName, count }))
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 10);
    
    // Most expanded categories
    const categoryExpands = eventsData
      .filter((e: any) => e.event_type === 'category_expand' && e.element_name)
      .reduce((acc: any, e: any) => {
        acc[e.element_name] = (acc[e.element_name] || 0) + 1;
        return acc;
      }, {});
    
    const mostExpandedCategories = Object.entries(categoryExpands)
      .map(([categoryName, count]) => ({ categoryName, count }))
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 10);
    
    // Entry point breakdown
    const entryPoints = sessionsData.length > 0 
      ? sessionsData.reduce((acc: any, s: any) => {
          const entry = s.entry_point || 'direct';
          acc[entry] = (acc[entry] || 0) + 1;
          return acc;
        }, {})
      : {};
    
    // Flow completion rates
    const menuToCheckoutRate = stats.totalSessions > 0
      ? ((totalCheckoutAttempts / stats.totalSessions) * 100).toFixed(2)
      : '0.00';
    const checkoutToOrderRate = totalCheckoutAttempts > 0
      ? ((stats.completedOrders / totalCheckoutAttempts) * 100).toFixed(2)
      : '0.00';
    
    // Engagement score (composite metric)
    const engagementScore = analyticsWithSessions?.length > 0
      ? Math.round(
          (stats.totalButtonClicks * 0.3 + 
           stats.totalItemsAdded * 0.4 + 
           totalCategoriesExpanded * 0.2 + 
           totalImagesClicked * 0.1) / analyticsWithSessions.length
        )
      : 0;

    return NextResponse.json({
      analytics: analyticsWithSessions,
      events: eventsData,
      stats: {
        ...stats,
        totalItemsRemoved,
        totalCategoriesExpanded,
        totalImagesClicked,
        totalCheckoutAttempts,
        avgItemsPerSession,
        avgSessionDuration,
        avgEventsPerSession,
        cartAbandonmentRate,
        bounceRate,
        menuToCheckoutRate,
        checkoutToOrderRate,
        engagementScore,
        entryPoints,
      },
      mostClickedItems,
      mostClickedButtons,
      mostExpandedCategories,
    });
  } catch (error: any) {
    console.error('Error fetching analytics report:', error);
    // Return empty data structure instead of error - tables might not exist yet
    return NextResponse.json({
      analytics: [],
      events: [],
      stats: {
        totalSessions: 0,
        completedOrders: 0,
        conversionRate: '0.00',
        totalPageViews: 0,
        totalButtonClicks: 0,
        totalItemsAdded: 0,
        totalItemsRemoved: 0,
        totalCategoriesExpanded: 0,
        totalImagesClicked: 0,
        totalCheckoutAttempts: 0,
        averageTimeInMenu: 0,
        averageTimeInCheckout: 0,
        avgItemsPerSession: '0.00',
        avgSessionDuration: 0,
        avgEventsPerSession: '0.0',
        cartAbandonmentRate: '0.00',
        bounceRate: '0.00',
        menuToCheckoutRate: '0.00',
        checkoutToOrderRate: '0.00',
        engagementScore: 0,
        dropoffPoints: { menu: 0, nameEntry: 0, orderPlaced: 0 },
        deviceBreakdown: { mobile: 0, tablet: 0, desktop: 0 },
        entryPoints: {},
      },
      mostClickedItems: [],
      mostClickedButtons: [],
      mostExpandedCategories: [],
    });
  }
}

