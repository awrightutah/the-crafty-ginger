-- The Crafty Ginger Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin users table
CREATE TABLE admin_users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products table
CREATE TABLE products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category TEXT NOT NULL,
  image_url TEXT,
  is_custom BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders table
CREATE TABLE orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  total DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'shipped', 'delivered', 'cancelled')),
  notes TEXT,
  venmo_username TEXT,
  order_type TEXT DEFAULT 'online' CHECK (order_type IN ('online', 'in_person', 'phone', 'custom')),
  payment_method TEXT DEFAULT 'venmo' CHECK (payment_method IN ('venmo', 'cash', 'other')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  sms_consent BOOLEAN DEFAULT FALSE,
  sms_consent_text TEXT,
  sms_consent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order items table
CREATE TABLE order_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  quantity INTEGER DEFAULT 1,
  price DECIMAL(10,2) NOT NULL,
  custom_options JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for products (public read, admin write)
CREATE POLICY "Products are viewable by everyone" ON products
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Admins can insert products" ON products
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can update products" ON products
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- RLS Policies for orders
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all orders" ON orders
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can update orders" ON orders
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- RLS Policies for order_items
CREATE POLICY "Users can view own order items" ON order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
  );

CREATE POLICY "Users can create order items" ON order_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
  );

CREATE POLICY "Admins can view all order items" ON order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert sample products
INSERT INTO products (name, description, price, category, image_url, is_custom) VALUES
('Glow in the Dark Keychain', 'Fun glow in the dark turquoise with a stunning purple tassel. Perfect for rearview mirrors!', 15.00, 'Keychains & Tassels', 'https://thecraftyginger.com/wp-content/uploads/2026/01/55d6ea4b-b936-417f-80d1-92dc523e92f5_1_201_a-1.jpg', false),
('Frosted Silver Keychain', 'Subtle yet powerful design with frosted silver finish.', 15.00, 'Keychains & Tassels', 'https://thecraftyginger.com/wp-content/uploads/2026/01/42663afc-1a08-4bfb-b933-261c9b14ae78.jpg', false),
('Marbled Coaster Set', 'Swirled colors that look like tiny art pieces on your table. Set of 4.', 35.00, 'Resin Coasters', 'https://thecraftyginger.com/wp-content/uploads/2025/11/img_0116.jpeg', false),
('Frosted Flower Coasters', 'Warm inviting flower style coasters that will compliment all tables. Set of 4.', 35.00, 'Resin Coasters', 'https://thecraftyginger.com/wp-content/uploads/2025/11/img_0150-3.jpeg', false),
('Flower Memorial Globe', 'Flowers permanently placed, perfect for preserving memories of loved ones.', 45.00, 'Resin Globes', 'https://thecraftyginger.com/wp-content/uploads/2025/11/img_0123-2.jpeg', false),
('Fairy Dreams Globe', 'Sleeping fairy resting in peace - a magical resin globe.', 40.00, 'Resin Globes', 'https://thecraftyginger.com/wp-content/uploads/2025/11/img_0091.jpeg', false),
('Custom Resin Tray', 'Personalized resin tray made to your specifications. Choose your colors and style!', 50.00, 'Custom Orders', 'https://thecraftyginger.com/wp-content/uploads/2025/11/img_0116.jpeg', true),
('Custom Ornament', 'Handcrafted resin ornament with your choice of colors, inclusions, and theme.', 25.00, 'Custom Orders', 'https://thecraftyginger.com/wp-content/uploads/2026/01/edabe28f-ecf3-4445-a43f-519d2a2722f8_1_201_a-1.jpg', true);

-- Video Gallery table for embedded content (supports multiple platforms)
CREATE TABLE instagram_reels (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  video_url TEXT,
  embed_code TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on instagram_reels
ALTER TABLE instagram_reels ENABLE ROW LEVEL SECURITY;

-- RLS Policies for instagram_reels (public read, admin write)
CREATE POLICY "Reels are viewable by everyone" ON instagram_reels
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Admins can insert reels" ON instagram_reels
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can update reels" ON instagram_reels
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can delete reels" ON instagram_reels
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- Create index for better performance
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_reels_sort_order ON instagram_reels(sort_order);