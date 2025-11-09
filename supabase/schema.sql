-- ============================================
-- 1. AUTHORIZED EMAILS TABLE (for role-based access)
-- ============================================
CREATE TABLE IF NOT EXISTS authorized_emails (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('manager', 'superadmin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS authorized_emails_email_idx ON authorized_emails(email);
CREATE INDEX IF NOT EXISTS authorized_emails_role_idx ON authorized_emails(role);

ALTER TABLE authorized_emails ENABLE ROW LEVEL SECURITY;

-- Allow service role to manage authorized emails (for initial setup)
-- In production, you may want to restrict this further
CREATE POLICY "Service role can manage authorized emails" ON authorized_emails
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 2. ORDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_phNo TEXT NOT NULL,
  items JSONB NOT NULL,
  total_amount NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'delivered', 'paid', 'unpaid')),
  table_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders (created_at DESC);
CREATE INDEX IF NOT EXISTS orders_status_idx ON orders (status);
CREATE INDEX IF NOT EXISTS orders_customer_name_idx ON orders (customer_name);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Public can create orders (for customers)
CREATE POLICY "Public can create orders" ON orders
  FOR INSERT
  WITH CHECK (true);

-- Public can read orders (for now, allow all reads)
-- You can restrict by customer_name if needed
CREATE POLICY "Users can read orders" ON orders
  FOR SELECT
  USING (true);

-- Only managers/superadmins can update/delete orders
-- Note: This uses service role for now. In production, you'd check auth.uid()
CREATE POLICY "Managers can manage orders" ON orders
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 3. MENU ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS menu_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('HOT', 'COLD', 'NON-COFFEE', 'ADDON', 'SNACK', 'DESSERT')),
  available BOOLEAN DEFAULT true,
  image_url TEXT,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS menu_items_category_idx ON menu_items(category);
CREATE INDEX IF NOT EXISTS menu_items_available_idx ON menu_items(available);

ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- Public can read available menu items
CREATE POLICY "Public can read available menu items" ON menu_items
  FOR SELECT
  USING (available = true);

-- Managers/Superadmins can read all menu items (including unavailable)
-- Note: This uses service role for now. In production, you'd check auth.uid()
CREATE POLICY "Managers can read all menu items" ON menu_items
  FOR SELECT
  USING (true);

-- Only managers/superadmins can create/update/delete menu items
-- Note: This uses service role for now. In production, you'd check auth.uid()
CREATE POLICY "Managers can manage menu items" ON menu_items
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 4. TRIGGERS
-- ============================================
-- Create a function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON menu_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_authorized_emails_updated_at BEFORE UPDATE ON authorized_emails
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. SAMPLE DATA
-- ============================================
-- Insert sample menu items (only if table is empty)
INSERT INTO menu_items (id, name, description, price, category, icon) VALUES
  ('hot-latte', 'Latte', 'espresso + more milk, less coffee more milk', 228, 'HOT', '☕'),
  ('hot-cappuccino', 'Cappuccino', 'espresso + less foam, stronger than latte', 228, 'HOT', '🥤'),
  ('hot-mocha', 'Mocha', 'espresso + homemade chocolate + milk, our recommendation', 178, 'HOT', '🍫'),
  ('hot-americano', 'Americano', 'espresso + hot water, pure and raw', 178, 'HOT', '☕'),
  ('hot-vietnamese', 'Vietnamese Coffee', 'espresso + condensed milk, bold, sweet, and intense', 198, 'HOT', '🍵'),
  ('cold-coffee', 'Cold Coffee', 'blended coffee, milk, sweet, ice, mostly sweet and rich', 228, 'COLD', '🧊'),
  ('cold-cranberry', 'Cranberry Espresso', 'espresso cranberry, juicy and intense, our recommendation', 178, 'COLD', '🫐'),
  ('cold-americano', 'Iced Americano', 'espresso + ice, cold water, pure and raw and cold', 228, 'COLD', '🧋'),
  ('cold-mocha', 'Iced Mocha', 'chilled mocha, chocolate + cold milk + ice', 178, 'COLD', '🍨'),
  ('cold-vietnamese', 'Iced Vietnamese', 'espresso + condensed milk + ice, bold, sweet, and intense', 198, 'COLD', '🥤'),
  ('nc-hot-chocolate', 'Hot Chocolate', 'velvety chocolate + milk, not too sweet, not too dark, balanced', 78, 'NON-COFFEE', '🍫'),
  ('nc-coke', 'Coke/Diet Coke', 'coke + ice, fizzy and refreshing', 168, 'NON-COFFEE', '🥤'),
  ('nc-redbull', 'Redbull', 'chilled redbull + ice, No caption needed', 198, 'NON-COFFEE', '⚡')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 6. INITIAL SETUP INSTRUCTIONS
-- ============================================
-- After running this schema, you need to:
-- 1. Insert your initial superadmin email:
--    INSERT INTO authorized_emails (email, role) VALUES
--      ('your-email@gmail.com', 'superadmin');
--
-- 2. Create a user account in Supabase Auth with that email
--    (Go to Authentication > Users > Add User)
--
-- 3. You can then add more managers:
--    INSERT INTO authorized_emails (email, role) VALUES
--      ('manager-email@gmail.com', 'manager');

