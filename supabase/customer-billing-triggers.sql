-- ============================================
-- CUSTOMER ALL ORDERS DETAILS TRIGGER FUNCTION
-- ============================================
-- This function updates customer_allorders_details table whenever
-- a new order is inserted into orders, workspace_seat_booking_orders,
-- snooker_booking_orders, or cowork_seat_booking_orders tables

CREATE OR REPLACE FUNCTION update_customer_allorders_details()
RETURNS TRIGGER AS $$
DECLARE
  v_customer_phno TEXT;
  v_customer_name TEXT;
  v_order_date DATE;
  v_order_value NUMERIC(10, 2);
  v_order_id UUID;
  v_order_type TEXT;
  v_order_status TEXT;
  v_existing_record RECORD;
  v_order_history JSONB;
  v_latest_date_json JSONB;
  v_allorder_value NUMERIC(10, 2);
  v_food_order_value NUMERIC(10, 2) := 0;
  v_workspace_order_value NUMERIC(10, 2) := 0;
  v_snooker_order_value NUMERIC(10, 2) := 0;
  v_food_order_uuid TEXT := NULL;
  v_workspace_order_uuid TEXT := NULL;
  v_snooker_order_uuid TEXT := NULL;
  v_allorder_status TEXT;
  v_latest_order_date DATE;
BEGIN
  -- Determine which table triggered this
  IF TG_TABLE_NAME = 'orders' THEN
    v_customer_phno := NEW.customer_phno;
    v_customer_name := NEW.customer_name;
    v_order_date := DATE(NEW.created_at);
    v_order_value := NEW.total_amount;
    v_order_id := NEW.id;
    v_order_type := 'FoodOrder';
    v_order_status := CASE 
      WHEN NEW.status IN ('paid') THEN 'PAID'
      ELSE 'UNPAID'
    END;
    v_food_order_value := NEW.total_amount;
    v_food_order_uuid := NEW.id::TEXT;
  ELSIF TG_TABLE_NAME = 'workspace_seat_booking_orders' THEN
    v_customer_phno := NEW.customer_phno;
    v_customer_name := NEW.customer_name;
    v_order_date := DATE(NEW.created_at);
    v_order_value := COALESCE(NEW.total_order_value, 0);
    v_order_id := NEW.workspace_order_id;
    v_order_type := 'WorkSpace';
    v_order_status := CASE 
      WHEN NEW.order_status IN ('Paid') THEN 'PAID'
      ELSE 'UNPAID'
    END;
    v_workspace_order_value := COALESCE(NEW.total_order_value, 0);
    v_workspace_order_uuid := NEW.workspace_order_id::TEXT;
  ELSIF TG_TABLE_NAME = 'snooker_booking_orders' THEN
    v_customer_phno := NEW.customer_phno;
    v_customer_name := COALESCE(NEW.customer_name, 'Unknown');
    v_order_date := DATE(NEW.created_at);
    v_order_value := COALESCE(NEW.total_order_amount, 0);
    v_order_id := NEW.snooker_order_id;
    v_order_type := 'SnookerOrder';
    v_order_status := CASE 
      WHEN NEW.order_status IN ('Paid', 'Ended') THEN 'PAID'
      ELSE 'UNPAID'
    END;
    v_snooker_order_value := COALESCE(NEW.total_order_amount, 0);
    v_snooker_order_uuid := NEW.snooker_order_id::TEXT;
  ELSIF TG_TABLE_NAME = 'cowork_seat_booking_orders' THEN
    v_customer_phno := NEW.customer_phno;
    v_customer_name := COALESCE(NEW.customer_name, 'Unknown');
    v_order_date := DATE(NEW.created_at);
    -- Get value from menu items table
    SELECT COALESCE(SUM(csm.cowork_seat_price), 0) INTO v_order_value
    FROM cowork_seat_menu_items csm
    WHERE csm.cowork_seat_menu_item_id = NEW.cowork_seat_menu_item_id;
    v_order_id := NEW.cowork_seat_order_id;
    v_order_type := 'CoworkOrder';
    v_order_status := CASE 
      WHEN NEW.cowork_seat_order_status IN ('Paid') THEN 'PAID'
      ELSE 'UNPAID'
    END;
  ELSE
    RETURN NEW;
  END IF;

  -- Check if customer record exists
  SELECT * INTO v_existing_record
  FROM customer_allorders_details
  WHERE customer_phno = v_customer_phno;

  IF v_existing_record IS NULL THEN
    -- Create new customer record
    INSERT INTO customer_allorders_details (
      customer_phno,
      customer_name,
      total_ordered_value_at_socialx,
      order_history_json,
      latestdate_allorder_json,
      latestdate_allorder_value,
      latestdate_allorder_status
    ) VALUES (
      v_customer_phno,
      v_customer_name,
      v_order_value,
      jsonb_build_array(
      jsonb_build_object(
        'order_date', v_order_date::TEXT,
        'Customer_PhNo', v_customer_phno,
        'Customer_Name', v_customer_name,
        'allorder_value', v_order_value,
        'FoodOrderUUID', COALESCE(v_food_order_uuid, ''),
        'WorkSpaceOrderUUID', COALESCE(v_workspace_order_uuid, ''),
        'SnookerOrderUUID', COALESCE(v_snooker_order_uuid, ''),
        'allOrder_Status', v_order_status
      )
    ),
    jsonb_build_object(
      'order_date', v_order_date::TEXT,
      'Customer_PhNo', v_customer_phno,
      'Customer_Name', v_customer_name,
      'allorder_value', v_order_value,
      'FoodOrderUUID', COALESCE(v_food_order_uuid, ''),
      'WorkSpaceOrderUUID', COALESCE(v_workspace_order_uuid, ''),
      'SnookerOrderUUID', COALESCE(v_snooker_order_uuid, ''),
      'allOrder_Status', v_order_status
    ),
      v_order_value,
      v_order_status
    );
  ELSE
    -- Update existing customer record
    -- First, find the latest order date for this customer (including the current order)
    SELECT MAX(order_date) INTO v_latest_order_date
    FROM (
      SELECT DATE(created_at) AS order_date FROM orders WHERE customer_phno = v_customer_phno
      UNION
      SELECT DATE(created_at) AS order_date FROM workspace_seat_booking_orders WHERE customer_phno = v_customer_phno
      UNION
      SELECT DATE(created_at) AS order_date FROM snooker_booking_orders WHERE customer_phno = v_customer_phno
      UNION
      SELECT v_order_date AS order_date  -- Include current order date
    ) all_dates;
    
    -- Ensure we use the latest date (should always be set now)
    IF v_latest_order_date IS NULL OR v_latest_order_date < v_order_date THEN
      v_latest_order_date := v_order_date;
    END IF;
    
    -- Get all orders for the latest order date to calculate total and collect UUIDs
    SELECT 
      COALESCE(SUM(CASE WHEN o.id IS NOT NULL THEN o.total_amount ELSE 0 END), 0),
      COALESCE(SUM(CASE WHEN w.workspace_order_id IS NOT NULL THEN COALESCE(w.total_order_value, 0) ELSE 0 END), 0),
      COALESCE(SUM(CASE WHEN s.snooker_order_id IS NOT NULL THEN COALESCE(s.total_order_amount, 0) ELSE 0 END), 0)
    INTO v_food_order_value, v_workspace_order_value, v_snooker_order_value
    FROM (SELECT v_latest_order_date AS order_date) d
    LEFT JOIN orders o ON DATE(o.created_at) = d.order_date AND o.customer_phno = v_customer_phno
    LEFT JOIN workspace_seat_booking_orders w ON DATE(w.created_at) = d.order_date AND w.customer_phno = v_customer_phno
    LEFT JOIN snooker_booking_orders s ON DATE(s.created_at) = d.order_date AND s.customer_phno = v_customer_phno;
    
    -- Get comma-separated list of UUIDs for the latest order date
    SELECT COALESCE(string_agg(o.id::TEXT, ','), NULL) INTO v_food_order_uuid
    FROM orders o
    WHERE DATE(o.created_at) = v_latest_order_date AND o.customer_phno = v_customer_phno;
    
    SELECT COALESCE(string_agg(w.workspace_order_id::TEXT, ','), NULL) INTO v_workspace_order_uuid
    FROM workspace_seat_booking_orders w
    WHERE DATE(w.created_at) = v_latest_order_date AND w.customer_phno = v_customer_phno;
    
    SELECT COALESCE(string_agg(s.snooker_order_id::TEXT, ','), NULL) INTO v_snooker_order_uuid
    FROM snooker_booking_orders s
    WHERE DATE(s.created_at) = v_latest_order_date AND s.customer_phno = v_customer_phno;

    v_allorder_value := v_food_order_value + v_workspace_order_value + v_snooker_order_value;
    
    -- Determine overall status (PAID if all are paid, else UNPAID) for the latest order date
    SELECT CASE 
      WHEN COUNT(*) FILTER (WHERE status NOT IN ('paid', 'Paid', 'Ended')) = 0 THEN 'PAID'
      ELSE 'UNPAID'
    END INTO v_allorder_status
    FROM (
      SELECT o.status FROM orders o WHERE DATE(o.created_at) = v_latest_order_date AND o.customer_phno = v_customer_phno
      UNION ALL
      SELECT w.order_status FROM workspace_seat_booking_orders w WHERE DATE(w.created_at) = v_latest_order_date AND w.customer_phno = v_customer_phno
      UNION ALL
      SELECT s.order_status FROM snooker_booking_orders s WHERE DATE(s.created_at) = v_latest_order_date AND s.customer_phno = v_customer_phno
    ) all_statuses;

    -- Update order_history_json - add or update entry for the latest order date
    v_order_history := COALESCE(v_existing_record.order_history_json, '[]'::jsonb);
    
    -- Remove existing entry for the latest order date if it exists
    v_order_history := (
      SELECT COALESCE(jsonb_agg(elem), '[]'::jsonb)
      FROM jsonb_array_elements(v_order_history) elem
      WHERE elem->>'order_date' != v_latest_order_date::TEXT
    );

    -- Add new entry for the latest order date
    v_order_history := v_order_history || jsonb_build_array(
      jsonb_build_object(
        'order_date', v_latest_order_date::TEXT,
        'Customer_PhNo', v_customer_phno,
        'Customer_Name', v_customer_name,
        'allorder_value', v_allorder_value,
        'FoodOrderUUID', COALESCE(v_food_order_uuid, ''),
        'WorkSpaceOrderUUID', COALESCE(v_workspace_order_uuid, ''),
        'SnookerOrderUUID', COALESCE(v_snooker_order_uuid, ''),
        'allOrder_Status', v_allorder_status
      )
    );

    -- Update latestdate_allorder_json (always keep only the most recent date)
    v_latest_date_json := jsonb_build_object(
      'order_date', v_latest_order_date::TEXT,
      'Customer_PhNo', v_customer_phno,
      'Customer_Name', v_customer_name,
      'allorder_value', v_allorder_value,
      'FoodOrderUUID', v_food_order_uuid,
      'WorkSpaceOrderUUID', v_workspace_order_uuid,
      'SnookerOrderUUID', v_snooker_order_uuid,
      'allOrder_Status', v_allorder_status
    );

    -- Update the customer record
    UPDATE customer_allorders_details
    SET
      customer_name = v_customer_name,
      total_ordered_value_at_socialx = total_ordered_value_at_socialx + v_order_value,
      order_history_json = v_order_history,
      latestdate_allorder_json = v_latest_date_json,
      latestdate_allorder_value = v_allorder_value,
      latestdate_allorder_status = v_allorder_status,
      updated_at = NOW()
    WHERE customer_phno = v_customer_phno;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- CREATE TRIGGERS
-- ============================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_customer_on_food_order ON orders;
DROP TRIGGER IF EXISTS update_customer_on_workspace_order ON workspace_seat_booking_orders;
DROP TRIGGER IF EXISTS update_customer_on_snooker_order ON snooker_booking_orders;
DROP TRIGGER IF EXISTS update_customer_on_cowork_order ON cowork_seat_booking_orders;

-- Create triggers for each order table
CREATE TRIGGER update_customer_on_food_order
AFTER INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION update_customer_allorders_details();

CREATE TRIGGER update_customer_on_workspace_order
AFTER INSERT ON workspace_seat_booking_orders
FOR EACH ROW
EXECUTE FUNCTION update_customer_allorders_details();

CREATE TRIGGER update_customer_on_snooker_order
AFTER INSERT ON snooker_booking_orders
FOR EACH ROW
EXECUTE FUNCTION update_customer_allorders_details();

CREATE TRIGGER update_customer_on_cowork_order
AFTER INSERT ON cowork_seat_booking_orders
FOR EACH ROW
EXECUTE FUNCTION update_customer_allorders_details();

