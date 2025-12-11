import { NextRequest, NextResponse } from 'next/server';
import { createAnonymousClient } from '@/lib/supabase/anonymous';

export async function POST(request: NextRequest) {
  try {
    // Use anonymous client with RLS policies for analytics data collection
    // RLS policies should allow anonymous inserts (see supabase/analytics-rls-policies.sql)
    const supabase = createAnonymousClient();
    const body = await request.json();

    const { visitorUuid, sessionId, events, deviceInfo } = body;

    if (!visitorUuid || !sessionId || !events || !Array.isArray(events)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get or create user session
    let sessionRecord;
    const { data: existingSession } = await supabase
      .from('user_sessions')
      .select('session_id')
      .eq('session_id', sessionId)
      .single();

    if (existingSession) {
      // Update existing session
      const { data: updatedSession, error: updateError } = await supabase
        .from('user_sessions')
        .update({
          last_activity_at: new Date().toISOString(),
          session_duration_seconds: Math.floor((Date.now() - new Date(existingSession.created_at || Date.now()).getTime()) / 1000),
        })
        .eq('session_id', sessionId)
        .select()
        .single();

      if (updateError) throw updateError;
      sessionRecord = updatedSession;
    } else {
      // Create new session
      const { data: newSession, error: createError } = await supabase
        .from('user_sessions')
        .insert({
          session_id: sessionId,
          visitor_uuid: visitorUuid,
          device_type: deviceInfo?.type || 'unknown',
          user_agent: deviceInfo?.userAgent || '',
          screen_width: deviceInfo?.screenWidth || 0,
          screen_height: deviceInfo?.screenHeight || 0,
          referrer_url: deviceInfo?.referrer || 'direct',
          entry_point: deviceInfo?.referrer ? 'link' : 'direct',
        })
        .select()
        .single();

      if (createError) throw createError;
      sessionRecord = newSession;
    }

    // Insert events
    const eventsToInsert = events.map((event: any) => ({
      session_id: sessionId,
      visitor_uuid: visitorUuid,
      event_type: event.eventType,
      event_category: event.eventCategory,
      page_route: event.pageRoute,
      view_state: event.viewState || null,
      element_id: event.elementId || null,
      element_name: event.elementName || null,
      element_type: event.elementType || null,
      metadata: event.metadata || {},
      time_on_page_seconds: event.timeOnPageSeconds || 0,
      scroll_position: event.scrollPosition || 0,
      timestamp: event.timestamp || new Date().toISOString(),
    }));

    const { error: eventsError } = await supabase
      .from('user_interaction_events')
      .insert(eventsToInsert);

    if (eventsError) throw eventsError;

    // Update or create flow analytics summary
    await updateFlowAnalytics(supabase, sessionId, visitorUuid, events);

    return NextResponse.json({ success: true, eventsProcessed: events.length });
  } catch (error: any) {
    console.error('Error processing analytics events:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process events' },
      { status: 500 }
    );
  }
}

async function updateFlowAnalytics(
  supabase: any,
  sessionId: string,
  visitorUuid: string,
  events: any[]
) {
  try {
    // Get existing analytics record
    const { data: existing } = await supabase
      .from('user_flow_analytics')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    // Calculate metrics from events
    const flowPath: string[] = [];
    const viewStates = new Set<string>();
    let totalPageViews = 0;
    let totalButtonClicks = 0;
    let totalItemsViewed = 0;
    let totalItemsAdded = 0;
    let totalItemsRemoved = 0;
    let categoriesExpanded = 0;
    let imagesClicked = 0;
    let timeInMenu = 0;
    let timeInNameEntry = 0;
    let timeInOrderPlaced = 0;
    let checkoutAttempts = 0;
    let orderCompleted = false;
    let dropoffPoint: string | null = null;

    events.forEach((event) => {
      if (event.eventType === 'page_view') totalPageViews++;
      if (event.eventType === 'button_click') totalButtonClicks++;
      if (event.eventType === 'item_add') totalItemsAdded++;
      if (event.eventType === 'item_remove') totalItemsRemoved++;
      if (event.eventType === 'category_expand') categoriesExpanded++;
      if (event.eventType === 'image_click') imagesClicked++;
      if (event.eventType === 'form_submit' && event.eventCategory === 'checkout') checkoutAttempts++;
      
      if (event.viewState) {
        viewStates.add(event.viewState);
        if (event.timeOnPageSeconds) {
          if (event.viewState === 'menu') timeInMenu += event.timeOnPageSeconds;
          if (event.viewState === 'nameEntry') timeInNameEntry += event.timeOnPageSeconds;
          if (event.viewState === 'orderPlaced') timeInOrderPlaced += event.timeOnPageSeconds;
        }
      }

      if (event.eventType === 'view_change') {
        if (event.metadata?.toView) {
          flowPath.push(event.metadata.toView);
        }
      }
    });

    // Determine conversion funnel step
    let conversionStep = 'menu_viewed';
    if (totalItemsAdded > 0) conversionStep = 'items_added';
    if (checkoutAttempts > 0) conversionStep = 'checkout_started';
    if (orderCompleted) conversionStep = 'order_placed';

    // Determine dropoff point
    if (!orderCompleted) {
      if (viewStates.has('orderPlaced')) dropoffPoint = 'orderPlaced';
      else if (viewStates.has('nameEntry')) dropoffPoint = 'nameEntry';
      else if (viewStates.has('menu')) dropoffPoint = 'menu';
    }

    const analyticsData = {
      session_id: sessionId,
      visitor_uuid: visitorUuid,
      date: new Date().toISOString().split('T')[0],
      flow_path: flowPath.length > 0 ? flowPath : Array.from(viewStates),
      total_page_views: totalPageViews,
      total_button_clicks: totalButtonClicks,
      total_items_viewed: totalItemsViewed,
      total_items_added: totalItemsAdded,
      total_items_removed: totalItemsRemoved,
      categories_expanded: categoriesExpanded,
      images_clicked: imagesClicked,
      time_in_menu_seconds: timeInMenu,
      time_in_nameentry_seconds: timeInNameEntry,
      time_in_orderplaced_seconds: timeInOrderPlaced,
      checkout_attempts: checkoutAttempts,
      order_completed: orderCompleted,
      conversion_funnel_step: conversionStep,
      dropoff_point: dropoffPoint,
    };

    if (existing) {
      // Update existing record
      const { error } = await supabase
        .from('user_flow_analytics')
        .update(analyticsData)
        .eq('session_id', sessionId);
      
      if (error) throw error;
    } else {
      // Create new record
      const { error } = await supabase
        .from('user_flow_analytics')
        .insert(analyticsData);
      
      if (error) throw error;
    }
  } catch (error) {
    console.error('Error updating flow analytics:', error);
    // Don't throw - analytics update failure shouldn't break event processing
  }
}

