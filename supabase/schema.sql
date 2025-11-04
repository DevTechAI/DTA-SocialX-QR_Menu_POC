-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  items JSONB NOT NULL,
  total_amount NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'delivered', 'paid', 'unpaid')),
  table_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create index on created_at for faster queries
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders (created_at DESC);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS orders_status_idx ON orders (status);

-- Enable Row Level Security (RLS)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for authenticated users
-- For development/demo, you might want to allow anonymous access
CREATE POLICY "Enable all access for service role" ON orders
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Optional: Create a function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Optional: Create menu_items table for better data management
CREATE TABLE IF NOT EXISTS menu_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('HOT', 'COLD', 'NON-COFFEE')),
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Enable RLS on menu_items
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- Create policy for menu_items
CREATE POLICY "Enable read access for all users" ON menu_items
  FOR SELECT
  USING (true);

CREATE POLICY "Enable all access for service role on menu_items" ON menu_items
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Insert sample menu items
INSERT INTO menu_items (id, name, description, price, category) VALUES
  ('hot-latte', 'Latte', 'espresso + more milk, less coffee more milk', 228, 'HOT'),
  ('hot-cappuccino', 'Cappuccino', 'espresso + less foam, stronger than latte', 228, 'HOT'),
  ('hot-mocha', 'Mocha', 'espresso + homemade chocolate + milk, our recommendation', 178, 'HOT'),
  ('hot-americano', 'Americano', 'espresso + hot water, pure and raw', 178, 'HOT'),
  ('hot-vietnamese', 'Vietnamese Coffee', 'espresso + condensed milk, bold, sweet, and intense', 198, 'HOT'),
  ('cold-coffee', 'Cold Coffee', 'blended coffee, milk, sweet, ice, mostly sweet and rich', 228, 'COLD'),
  ('cold-cranberry', 'Cranberry Espresso', 'espresso cranberry, juicy and intense, our recommendation', 178, 'COLD'),
  ('cold-americano', 'Iced Americano', 'espresso + ice, cold water, pure and raw and cold', 228, 'COLD'),
  ('cold-mocha', 'Iced Mocha', 'chilled mocha, chocolate + cold milk + ice', 178, 'COLD'),
  ('cold-vietnamese', 'Iced Vietnamese', 'espresso + condensed milk + ice, bold, sweet, and intense', 198, 'COLD'),
  ('nc-hot-chocolate', 'Hot Chocolate', 'velvety chocolate + milk, not too sweet, not too dark, balanced', 78, 'NON-COFFEE'),
  ('nc-coke', 'Coke/Diet Coke', 'coke + ice, fizzy and refreshing', 168, 'NON-COFFEE'),
  ('nc-redbull', 'Redbull', 'chilled redbull + ice, No caption needed', 198, 'NON-COFFEE')
ON CONFLICT (id) DO NOTHING;

