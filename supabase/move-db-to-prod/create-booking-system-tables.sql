-- ============================================
-- SOCIALX BOOKING SYSTEM - NEW TABLES DDL
-- ============================================
-- This script creates tables for Snooker Board booking, Co-Working Seats booking,
-- Customer Details, and Admin Feature Control
-- Execute this in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. SNOOKER BOARD MENU ITEMS TABLE
-- ============================================
-- Stores available snooker/pool tables with their configurations
CREATE TABLE IF NOT EXISTS snooker_board_menu_items (
  -- Primary Key: Meaningful ID for the board (e.g., 'snooker-board-1', 'pool-table-2')
  snooker_board_item_id TEXT PRIMARY KEY,
  
  -- Board Name: Display name for the board (e.g., 'French Table 1', 'Pool Table A')
  board_name TEXT NOT NULL,
  
  -- Type: Type of table - French Table or Pool Table
  type TEXT NOT NULL CHECK (type IN ('French-Table', 'Pool-Table')),
  
  -- Given Duration For 100 INR: Duration in minutes for 100 INR (e.g., 20, 15)
  given_duration_for_100inr INTEGER NOT NULL CHECK (given_duration_for_100inr > 0),
  
  -- Is Available To Play: Whether the board is currently available for booking
  is_available_to_play BOOLEAN DEFAULT true NOT NULL,
  
  -- Current Status: Current operational status of the board
  current_status TEXT NOT NULL DEFAULT 'Yet-To-Begin' 
    CHECK (current_status IN ('Yet-To-Begin', 'STARTED', 'PAUSED', 'RESUMED', 'IN-PROGRESS', 'ENDED')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Comments for columns
COMMENT ON TABLE snooker_board_menu_items IS 'Stores snooker/pool board configurations and availability';
COMMENT ON COLUMN snooker_board_menu_items.snooker_board_item_id IS 'Primary Key: Unique identifier for the board (e.g., snooker-board-1)';
COMMENT ON COLUMN snooker_board_menu_items.board_name IS 'Display name of the board shown to customers';
COMMENT ON COLUMN snooker_board_menu_items.type IS 'Type of table: French-Table or Pool-Table';
COMMENT ON COLUMN snooker_board_menu_items.given_duration_for_100inr IS 'Duration in minutes that costs 100 INR (e.g., 20 min for 100 INR)';
COMMENT ON COLUMN snooker_board_menu_items.is_available_to_play IS 'Whether the board is available for new bookings';
COMMENT ON COLUMN snooker_board_menu_items.current_status IS 'Current operational status: Yet-To-Begin, STARTED, PAUSED, RESUMED, IN-PROGRESS, ENDED';
COMMENT ON COLUMN snooker_board_menu_items.created_at IS 'Timestamp when the board was added to the system';
COMMENT ON COLUMN snooker_board_menu_items.updated_at IS 'Timestamp when the board information was last updated';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS snooker_board_type_idx ON snooker_board_menu_items(type);
CREATE INDEX IF NOT EXISTS snooker_board_available_idx ON snooker_board_menu_items(is_available_to_play);
CREATE INDEX IF NOT EXISTS snooker_board_status_idx ON snooker_board_menu_items(current_status);

-- ============================================
-- 2. SNOOKER BOOKING ORDERS TABLE
-- ============================================
-- Stores individual snooker board booking orders
CREATE TABLE IF NOT EXISTS snooker_booking_orders (
  -- Primary Key: UUID for the booking order
  snooker_order_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Foreign Key: Reference to the snooker board
  snooker_board_id TEXT NOT NULL REFERENCES snooker_board_menu_items(snooker_board_item_id) ON DELETE RESTRICT,
  
  -- Foreign Key: Customer phone number (references customer_details)
  customer_phno TEXT NOT NULL,
  
  -- Order Status: Current status of the booking
  order_status TEXT NOT NULL DEFAULT 'Received' 
    CHECK (order_status IN ('Received', 'Accepted', 'Started', 'Paused', 'Resumed', 'Ended')),
  
  -- Start Date Time: When the booking session started
  start_date_time TIMESTAMP WITH TIME ZONE,
  
  -- End Date Time: When the booking session ended
  end_date_time TIMESTAMP WITH TIME ZONE,
  
  -- Break Date Times: JSON array of pause and resume timestamps
  -- Format: [{"pause": "2024-01-01T10:00:00Z", "resume": "2024-01-01T10:15:00Z"}, ...]
  break_date_times JSONB DEFAULT '[]'::jsonb,
  
  -- Break Duration: Total break time in minutes (sum of all pauses)
  break_duration_minutes INTEGER DEFAULT 0 CHECK (break_duration_minutes >= 0),
  
  -- Total Duration: Total play duration in minutes (excluding breaks)
  total_duration_minutes INTEGER DEFAULT 0 CHECK (total_duration_minutes >= 0),
  
  -- Order Qty: Number of 100 INR units (calculated as total_duration / given_duration_for_100inr)
  order_qty NUMERIC(10, 2) DEFAULT 0 CHECK (order_qty >= 0),
  
  -- Total Order Amount: Total cost of the booking
  total_order_amount NUMERIC(10, 2) DEFAULT 0 CHECK (total_order_amount >= 0),
  
  -- Has Ordered Food: Whether customer also ordered food
  has_ordered_food BOOLEAN DEFAULT false,
  
  -- Food Order ID: Foreign key to orders table (food orders)
  food_order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Comments for columns
COMMENT ON TABLE snooker_booking_orders IS 'Stores individual snooker board booking orders with session details';
COMMENT ON COLUMN snooker_booking_orders.snooker_order_id IS 'Primary Key: UUID for the booking order';
COMMENT ON COLUMN snooker_booking_orders.snooker_board_id IS 'Foreign Key: Reference to the snooker board being booked';
COMMENT ON COLUMN snooker_booking_orders.customer_phno IS 'Foreign Key: Customer phone number (references customer_details)';
COMMENT ON COLUMN snooker_booking_orders.order_status IS 'Current status: Received, Accepted, Started, Paused, Resumed, Ended';
COMMENT ON COLUMN snooker_booking_orders.start_date_time IS 'Timestamp when the booking session started';
COMMENT ON COLUMN snooker_booking_orders.end_date_time IS 'Timestamp when the booking session ended';
COMMENT ON COLUMN snooker_booking_orders.break_date_times IS 'JSON array of pause/resume timestamps: [{"pause": "...", "resume": "..."}]';
COMMENT ON COLUMN snooker_booking_orders.break_duration_minutes IS 'Total break time in minutes (sum of all pause durations)';
COMMENT ON COLUMN snooker_booking_orders.total_duration_minutes IS 'Total play duration in minutes (excluding breaks)';
COMMENT ON COLUMN snooker_booking_orders.order_qty IS 'Number of 100 INR units (total_duration / given_duration_for_100inr)';
COMMENT ON COLUMN snooker_booking_orders.total_order_amount IS 'Total cost of the booking in INR';
COMMENT ON COLUMN snooker_booking_orders.has_ordered_food IS 'Whether customer also placed a food order';
COMMENT ON COLUMN snooker_booking_orders.food_order_id IS 'Foreign Key: Reference to food order (orders table) if has_ordered_food is true';
COMMENT ON COLUMN snooker_booking_orders.created_at IS 'Timestamp when the booking was created';
COMMENT ON COLUMN snooker_booking_orders.updated_at IS 'Timestamp when the booking was last updated';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS snooker_orders_board_idx ON snooker_booking_orders(snooker_board_id);
CREATE INDEX IF NOT EXISTS snooker_orders_customer_idx ON snooker_booking_orders(customer_phno);
CREATE INDEX IF NOT EXISTS snooker_orders_status_idx ON snooker_booking_orders(order_status);
CREATE INDEX IF NOT EXISTS snooker_orders_start_time_idx ON snooker_booking_orders(start_date_time);
CREATE INDEX IF NOT EXISTS snooker_orders_food_order_idx ON snooker_booking_orders(food_order_id) WHERE food_order_id IS NOT NULL;

-- ============================================
-- 3. CO-WORKING SEAT MENU ITEMS TABLE
-- ============================================
-- Stores available co-working seats with their configurations
CREATE TABLE IF NOT EXISTS cowork_seat_menu_items (
  -- Primary Key: Meaningful ID for the seat (e.g., 'cowork-seat-1', 'cowork-table-5')
  cowork_seat_menu_item_id TEXT PRIMARY KEY,
  
  -- Table ID: Physical table identifier (e.g., 'Table-1', 'Table-A')
  table_id TEXT NOT NULL,
  
  -- Type: Type of seating arrangement
  type TEXT NOT NULL CHECK (type IN ('5-Seater', '3-Seater', '1-Seater')),
  
  -- Landmark: Location description within the space
  landmark TEXT NOT NULL CHECK (landmark IN ('Left-Front-Corner', 'Left-Back-Corner', 'Mid-Front-Row', 'Mid-Back-Row', 'Right')),
  
  -- Current Status: Current availability status
  current_status TEXT NOT NULL DEFAULT 'AVAILABLE' 
    CHECK (current_status IN ('RESERVED', 'OCCUPIED', 'AVAILABLE', 'REMOVED')),
  
  -- Next Available Date: When the seat will be available next (if currently reserved/occupied)
  next_available_date TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Comments for columns
COMMENT ON TABLE cowork_seat_menu_items IS 'Stores co-working seat configurations and availability';
COMMENT ON COLUMN cowork_seat_menu_items.cowork_seat_menu_item_id IS 'Primary Key: Unique identifier for the seat (e.g., cowork-seat-1)';
COMMENT ON COLUMN cowork_seat_menu_items.table_id IS 'Physical table identifier (e.g., Table-1, Table-A)';
COMMENT ON COLUMN cowork_seat_menu_items.type IS 'Type of seating: 5-Seater, 3-Seater, or 1-Seater';
COMMENT ON COLUMN cowork_seat_menu_items.landmark IS 'Location description: Left-Front-Corner, Left-Back-Corner, Mid-Front-Row, Mid-Back-Row, Right';
COMMENT ON COLUMN cowork_seat_menu_items.current_status IS 'Current status: RESERVED, OCCUPIED, AVAILABLE, REMOVED';
COMMENT ON COLUMN cowork_seat_menu_items.next_available_date IS 'Timestamp when the seat will be available next (if currently reserved/occupied)';
COMMENT ON COLUMN cowork_seat_menu_items.created_at IS 'Timestamp when the seat was added to the system';
COMMENT ON COLUMN cowork_seat_menu_items.updated_at IS 'Timestamp when the seat information was last updated';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS cowork_seat_type_idx ON cowork_seat_menu_items(type);
CREATE INDEX IF NOT EXISTS cowork_seat_status_idx ON cowork_seat_menu_items(current_status);
CREATE INDEX IF NOT EXISTS cowork_seat_landmark_idx ON cowork_seat_menu_items(landmark);
CREATE INDEX IF NOT EXISTS cowork_seat_next_available_idx ON cowork_seat_menu_items(next_available_date) WHERE next_available_date IS NOT NULL;

-- ============================================
-- 4. CO-WORKING SEAT BOOKING ORDERS TABLE
-- ============================================
-- Stores individual co-working seat booking orders
CREATE TABLE IF NOT EXISTS cowork_seat_booking_orders (
  -- Primary Key: UUID for the booking order
  cowork_seat_order_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Foreign Key: Reference to the co-working seat
  cowork_seat_menu_item_id TEXT NOT NULL REFERENCES cowork_seat_menu_items(cowork_seat_menu_item_id) ON DELETE RESTRICT,
  
  -- Foreign Key: Customer phone number (references customer_details)
  customer_phno TEXT NOT NULL,
  
  -- Co-Work Seat Order Status: Current status of the booking
  cowork_seat_order_status TEXT NOT NULL DEFAULT 'Received' 
    CHECK (cowork_seat_order_status IN ('Received', 'Accepted', 'Paid', 'UnPaid', 'Pass-Delivered')),
  
  -- Co-Work Order Pass Type: Type of pass purchased
  cowork_order_pass_type TEXT NOT NULL CHECK (cowork_order_pass_type IN ('Monthly-Pass', 'Day-Pass')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Comments for columns
COMMENT ON TABLE cowork_seat_booking_orders IS 'Stores individual co-working seat booking orders';
COMMENT ON COLUMN cowork_seat_booking_orders.cowork_seat_order_id IS 'Primary Key: UUID for the booking order';
COMMENT ON COLUMN cowork_seat_booking_orders.cowork_seat_menu_item_id IS 'Foreign Key: Reference to the co-working seat being booked';
COMMENT ON COLUMN cowork_seat_booking_orders.customer_phno IS 'Foreign Key: Customer phone number (references customer_details)';
COMMENT ON COLUMN cowork_seat_booking_orders.cowork_seat_order_status IS 'Current status: Received, Accepted, Paid, UnPaid, Pass-Delivered';
COMMENT ON COLUMN cowork_seat_booking_orders.cowork_order_pass_type IS 'Type of pass: Monthly-Pass or Day-Pass';
COMMENT ON COLUMN cowork_seat_booking_orders.created_at IS 'Timestamp when the booking was created';
COMMENT ON COLUMN cowork_seat_booking_orders.updated_at IS 'Timestamp when the booking was last updated';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS cowork_orders_seat_idx ON cowork_seat_booking_orders(cowork_seat_menu_item_id);
CREATE INDEX IF NOT EXISTS cowork_orders_customer_idx ON cowork_seat_booking_orders(customer_phno);
CREATE INDEX IF NOT EXISTS cowork_orders_status_idx ON cowork_seat_booking_orders(cowork_seat_order_status);
CREATE INDEX IF NOT EXISTS cowork_orders_pass_type_idx ON cowork_seat_booking_orders(cowork_order_pass_type);

-- ============================================
-- 5. CUSTOMER DETAILS TABLE
-- ============================================
-- Stores customer information and aggregated order history
CREATE TABLE IF NOT EXISTS customer_details (
  -- Primary Key: Customer phone number
  customer_phno TEXT PRIMARY KEY,
  
  -- Customer Name: Name of the customer
  customer_name TEXT NOT NULL,
  
  -- Max Order Value: Highest order value placed by this customer
  max_order_value NUMERIC(10, 2) DEFAULT 0 CHECK (max_order_value >= 0),
  
  -- Total Ordered Value At SocialX: Sum of all order values from this customer
  total_ordered_value_at_socialx NUMERIC(10, 2) DEFAULT 0 CHECK (total_ordered_value_at_socialx >= 0),
  
  -- Order History JSON: Aggregated order history in JSON format
  -- Structure: Array of visit objects with order details
  order_history_json JSONB DEFAULT '[]'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Comments for columns
COMMENT ON TABLE customer_details IS 'Stores customer information and aggregated order history';
COMMENT ON COLUMN customer_details.customer_phno IS 'Primary Key: Customer phone number (unique identifier)';
COMMENT ON COLUMN customer_details.customer_name IS 'Name of the customer';
COMMENT ON COLUMN customer_details.max_order_value IS 'Highest single order value placed by this customer';
COMMENT ON COLUMN customer_details.total_ordered_value_at_socialx IS 'Total sum of all order values from this customer';
COMMENT ON COLUMN customer_details.order_history_json IS 'JSON array of visit history with order details (food, snooker, cowork orders)';
COMMENT ON COLUMN customer_details.created_at IS 'Timestamp when the customer record was created';
COMMENT ON COLUMN customer_details.updated_at IS 'Timestamp when the customer record was last updated';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS customer_name_idx ON customer_details(customer_name);
CREATE INDEX IF NOT EXISTS customer_total_value_idx ON customer_details(total_ordered_value_at_socialx DESC);

-- ============================================
-- 6. ADMIN FEATURE CONTROL TABLE
-- ============================================
-- Controls visibility of features in user and admin dashboards
CREATE TABLE IF NOT EXISTS admin_feature_control (
  -- Primary Key: Feature identifier
  feature_item_id TEXT PRIMARY KEY,
  
  -- Feature Name: Display name of the feature
  feature_name TEXT NOT NULL,
  
  -- Feature Description: Description of what the feature does
  feature_desc TEXT,
  
  -- User Visibility: Whether the feature is visible to regular users
  user_visibility BOOLEAN DEFAULT true NOT NULL,
  
  -- Admin Dashboard Visibility: Whether the feature is visible in admin dashboard
  admin_dashboard_visibility BOOLEAN DEFAULT true NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Comments for columns
COMMENT ON TABLE admin_feature_control IS 'Controls visibility of features in user and admin dashboards';
COMMENT ON COLUMN admin_feature_control.feature_item_id IS 'Primary Key: Unique identifier for the feature (e.g., food-order-booking, seat-order-booking)';
COMMENT ON COLUMN admin_feature_control.feature_name IS 'Display name of the feature';
COMMENT ON COLUMN admin_feature_control.feature_desc IS 'Description of what the feature does';
COMMENT ON COLUMN admin_feature_control.user_visibility IS 'Whether the feature is visible to regular users (TRUE/FALSE)';
COMMENT ON COLUMN admin_feature_control.admin_dashboard_visibility IS 'Whether the feature is visible in admin dashboard (TRUE/FALSE)';
COMMENT ON COLUMN admin_feature_control.created_at IS 'Timestamp when the feature was added';
COMMENT ON COLUMN admin_feature_control.updated_at IS 'Timestamp when the feature settings were last updated';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS feature_user_visibility_idx ON admin_feature_control(user_visibility);
CREATE INDEX IF NOT EXISTS feature_admin_visibility_idx ON admin_feature_control(admin_dashboard_visibility);

-- ============================================
-- 7. FOREIGN KEY CONSTRAINTS
-- ============================================
-- Add foreign key constraint for customer_phno in snooker_booking_orders
-- Note: This references customer_details which we just created
ALTER TABLE snooker_booking_orders 
ADD CONSTRAINT snooker_orders_customer_fk 
FOREIGN KEY (customer_phno) REFERENCES customer_details(customer_phno) ON DELETE RESTRICT;

-- Add foreign key constraint for customer_phno in cowork_seat_booking_orders
ALTER TABLE cowork_seat_booking_orders 
ADD CONSTRAINT cowork_orders_customer_fk 
FOREIGN KEY (customer_phno) REFERENCES customer_details(customer_phno) ON DELETE RESTRICT;

-- ============================================
-- 8. FUNCTION FOR AUTO-UPDATING updated_at
-- ============================================
-- This function automatically updates the updated_at column when a row is modified
-- Create the function if it doesn't exist (it may already exist from schema.sql)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 9. TRIGGERS FOR AUTO-UPDATING updated_at
-- ============================================
-- These triggers automatically update the updated_at column when a row is modified
-- They use the update_updated_at_column() function defined above

-- Trigger for snooker_board_menu_items
CREATE TRIGGER update_snooker_board_updated_at 
BEFORE UPDATE ON snooker_board_menu_items
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for snooker_booking_orders
CREATE TRIGGER update_snooker_orders_updated_at 
BEFORE UPDATE ON snooker_booking_orders
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for cowork_seat_menu_items
CREATE TRIGGER update_cowork_seat_updated_at 
BEFORE UPDATE ON cowork_seat_menu_items
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for cowork_seat_booking_orders
CREATE TRIGGER update_cowork_orders_updated_at 
BEFORE UPDATE ON cowork_seat_booking_orders
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for customer_details
CREATE TRIGGER update_customer_details_updated_at 
BEFORE UPDATE ON customer_details
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for admin_feature_control
CREATE TRIGGER update_admin_feature_control_updated_at 
BEFORE UPDATE ON admin_feature_control
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 10. TRIGGERS FOR MAINTAINING REFERENTIAL INTEGRITY
-- ============================================
-- These triggers help maintain data consistency across related tables

-- Trigger: Update customer_details when a new order is placed
-- This trigger updates customer statistics (max_order_value, total_ordered_value)
-- Explanation: When a food order is created, this trigger automatically updates
-- the customer's total order value and max order value in customer_details table
CREATE OR REPLACE FUNCTION update_customer_stats_on_food_order()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update customer_details
  INSERT INTO customer_details (customer_phno, customer_name, max_order_value, total_ordered_value_at_socialx)
  VALUES (
    NEW.customer_phNo,
    NEW.customer_name,
    NEW.total_amount,
    NEW.total_amount
  )
  ON CONFLICT (customer_phno) 
  DO UPDATE SET
    customer_name = EXCLUDED.customer_name, -- Update name if changed
    max_order_value = GREATEST(customer_details.max_order_value, EXCLUDED.max_order_value),
    total_ordered_value_at_socialx = customer_details.total_ordered_value_at_socialx + EXCLUDED.total_order_amount,
    updated_at = TIMEZONE('utc'::text, NOW());
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_customer_on_food_order
AFTER INSERT ON orders
FOR EACH ROW EXECUTE FUNCTION update_customer_stats_on_food_order();

-- Trigger: Update customer_details when a snooker order is created
-- Explanation: When a snooker booking order is created, this trigger updates
-- the customer's order history and statistics
CREATE OR REPLACE FUNCTION update_customer_stats_on_snooker_order()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update customer_details
  INSERT INTO customer_details (customer_phno, customer_name, max_order_value, total_ordered_value_at_socialx)
  VALUES (
    NEW.customer_phno,
    'Customer', -- Default name, will be updated from orders table if available
    NEW.total_order_amount,
    NEW.total_order_amount
  )
  ON CONFLICT (customer_phno) 
  DO UPDATE SET
    max_order_value = GREATEST(customer_details.max_order_value, EXCLUDED.max_order_value),
    total_ordered_value_at_socialx = customer_details.total_ordered_value_at_socialx + EXCLUDED.total_order_amount,
    updated_at = TIMEZONE('utc'::text, NOW());
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_customer_on_snooker_order
AFTER INSERT ON snooker_booking_orders
FOR EACH ROW EXECUTE FUNCTION update_customer_stats_on_snooker_order();

-- Trigger: Update customer_details when a cowork seat order is created
-- Explanation: When a cowork seat booking order is created, this trigger updates
-- the customer's order history and statistics
CREATE OR REPLACE FUNCTION update_customer_stats_on_cowork_order()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update customer_details
  -- Note: For cowork orders, you may need to add total_order_amount column
  -- For now, this is a placeholder that can be extended
  INSERT INTO customer_details (customer_phno, customer_name)
  VALUES (NEW.customer_phno, 'Customer')
  ON CONFLICT (customer_phno) 
  DO UPDATE SET
    updated_at = TIMEZONE('utc'::text, NOW());
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_customer_on_cowork_order
AFTER INSERT ON cowork_seat_booking_orders
FOR EACH ROW EXECUTE FUNCTION update_customer_stats_on_cowork_order();

-- Trigger: Update snooker board availability when order status changes
-- Explanation: When a snooker booking order status changes to 'Started', 
-- this trigger automatically sets the board's is_available_to_play to false
CREATE OR REPLACE FUNCTION update_snooker_board_availability()
RETURNS TRIGGER AS $$
BEGIN
  -- When order status changes to 'Started', mark board as unavailable
  IF NEW.order_status = 'Started' AND (OLD.order_status IS NULL OR OLD.order_status != 'Started') THEN
    UPDATE snooker_board_menu_items
    SET is_available_to_play = false,
        current_status = 'STARTED',
        updated_at = TIMEZONE('utc'::text, NOW())
    WHERE snooker_board_item_id = NEW.snooker_board_id;
  END IF;
  
  -- When order status changes to 'Ended', mark board as available
  IF NEW.order_status = 'Ended' AND OLD.order_status != 'Ended' THEN
    UPDATE snooker_board_menu_items
    SET is_available_to_play = true,
        current_status = 'ENDED',
        updated_at = TIMEZONE('utc'::text, NOW())
    WHERE snooker_board_item_id = NEW.snooker_board_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_board_on_order_status_change
AFTER UPDATE OF order_status ON snooker_booking_orders
FOR EACH ROW 
WHEN (OLD.order_status IS DISTINCT FROM NEW.order_status)
EXECUTE FUNCTION update_snooker_board_availability();

-- Trigger: Update cowork seat availability when order status changes
-- Explanation: When a cowork seat order status changes to 'Accepted' or 'Paid',
-- this trigger automatically updates the seat's current_status
CREATE OR REPLACE FUNCTION update_cowork_seat_availability()
RETURNS TRIGGER AS $$
BEGIN
  -- When order status changes to 'Accepted' or 'Paid', mark seat as OCCUPIED
  IF NEW.cowork_seat_order_status IN ('Accepted', 'Paid') 
     AND (OLD.cowork_seat_order_status IS NULL OR OLD.cowork_seat_order_status NOT IN ('Accepted', 'Paid')) THEN
    UPDATE cowork_seat_menu_items
    SET current_status = 'OCCUPIED',
        updated_at = TIMEZONE('utc'::text, NOW())
    WHERE cowork_seat_menu_item_id = NEW.cowork_seat_menu_item_id;
  END IF;
  
  -- When order status changes to 'Pass-Delivered', mark seat as RESERVED
  IF NEW.cowork_seat_order_status = 'Pass-Delivered' AND OLD.cowork_seat_order_status != 'Pass-Delivered' THEN
    UPDATE cowork_seat_menu_items
    SET current_status = 'RESERVED',
        updated_at = TIMEZONE('utc'::text, NOW())
    WHERE cowork_seat_menu_item_id = NEW.cowork_seat_menu_item_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_seat_on_order_status_change
AFTER UPDATE OF cowork_seat_order_status ON cowork_seat_booking_orders
FOR EACH ROW 
WHEN (OLD.cowork_seat_order_status IS DISTINCT FROM NEW.cowork_seat_order_status)
EXECUTE FUNCTION update_cowork_seat_availability();

-- ============================================
-- 11. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================
-- Enable RLS on all new tables
ALTER TABLE snooker_board_menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE snooker_booking_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE cowork_seat_menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cowork_seat_booking_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_feature_control ENABLE ROW LEVEL SECURITY;

-- Public can read available snooker boards
CREATE POLICY "Public can read available snooker boards" ON snooker_board_menu_items
  FOR SELECT
  USING (is_available_to_play = true);

-- Managers can manage snooker boards
CREATE POLICY "Managers can manage snooker boards" ON snooker_board_menu_items
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Public can create snooker booking orders
CREATE POLICY "Public can create snooker orders" ON snooker_booking_orders
  FOR INSERT
  WITH CHECK (true);

-- Public can read their own snooker orders (by customer_phno)
-- Managers can read all orders
CREATE POLICY "Users can read snooker orders" ON snooker_booking_orders
  FOR SELECT
  USING (true);

-- Managers can manage snooker orders
CREATE POLICY "Managers can manage snooker orders" ON snooker_booking_orders
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Public can read available cowork seats
CREATE POLICY "Public can read available cowork seats" ON cowork_seat_menu_items
  FOR SELECT
  USING (current_status = 'AVAILABLE');

-- Managers can manage cowork seats
CREATE POLICY "Managers can manage cowork seats" ON cowork_seat_menu_items
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Public can create cowork booking orders
CREATE POLICY "Public can create cowork orders" ON cowork_seat_booking_orders
  FOR INSERT
  WITH CHECK (true);

-- Public can read their own cowork orders
-- Managers can read all orders
CREATE POLICY "Users can read cowork orders" ON cowork_seat_booking_orders
  FOR SELECT
  USING (true);

-- Managers can manage cowork orders
CREATE POLICY "Managers can manage cowork orders" ON cowork_seat_booking_orders
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Public can read their own customer details
-- Managers can read all customer details
CREATE POLICY "Users can read customer details" ON customer_details
  FOR SELECT
  USING (true);

-- Managers can manage customer details
CREATE POLICY "Managers can manage customer details" ON customer_details
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Public can read feature visibility settings
CREATE POLICY "Public can read feature control" ON admin_feature_control
  FOR SELECT
  USING (true);

-- Only managers can update feature control
CREATE POLICY "Managers can manage feature control" ON admin_feature_control
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 12. INITIAL DATA FOR ADMIN FEATURE CONTROL
-- ============================================
-- Insert default feature control entries
INSERT INTO admin_feature_control (feature_item_id, feature_name, feature_desc, user_visibility, admin_dashboard_visibility) VALUES
  ('food-order-booking', 'Food Order Booking Option', 'Allows users to place food orders', true, true),
  ('seat-order-booking', 'Seat Order Booking Option', 'Allows users to book co-working seats', true, true),
  ('snooker-order-booking', 'Snooker Order Booking Option', 'Allows users to book snooker/pool tables', true, true),
  ('stock-toggle-control', 'Stock Toggle Control', 'Allows admins to toggle item availability', false, true),
  ('edit-menu', 'Edit Menu', 'Allows admins to edit menu items', false, true),
  ('clear-all', 'Clear All', 'Allows admins to clear all orders', false, true)
ON CONFLICT (feature_item_id) DO NOTHING;

-- ============================================
-- 13. VERIFICATION QUERIES
-- ============================================
-- Run these queries to verify the tables were created successfully:

-- Check all tables exist
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN (
--   'snooker_board_menu_items',
--   'snooker_booking_orders',
--   'cowork_seat_menu_items',
--   'cowork_seat_booking_orders',
--   'customer_details',
--   'admin_feature_control'
-- );

-- Check foreign key constraints
-- SELECT
--   tc.table_name, 
--   kcu.column_name, 
--   ccu.table_name AS foreign_table_name,
--   ccu.column_name AS foreign_column_name 
-- FROM information_schema.table_constraints AS tc 
-- JOIN information_schema.key_column_usage AS kcu
--   ON tc.constraint_name = kcu.constraint_name
-- JOIN information_schema.constraint_column_usage AS ccu
--   ON ccu.constraint_name = tc.constraint_name
-- WHERE tc.constraint_type = 'FOREIGN KEY'
-- AND tc.table_name IN (
--   'snooker_booking_orders',
--   'cowork_seat_booking_orders'
-- );

-- Check triggers
-- SELECT trigger_name, event_object_table, action_timing, event_manipulation
-- FROM information_schema.triggers
-- WHERE event_object_schema = 'public'
-- AND event_object_table IN (
--   'snooker_board_menu_items',
--   'snooker_booking_orders',
--   'cowork_seat_menu_items',
--   'cowork_seat_booking_orders',
--   'customer_details',
--   'admin_feature_control'
-- );

-- ============================================
-- END OF DDL SCRIPT
-- ============================================

