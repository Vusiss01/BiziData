-- Complete Supabase Setup Script
-- This script sets up the entire database schema, RLS policies, and storage buckets

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tables
CREATE TABLE users (
  id uuid primary key default uuid_generate_v4(),
  email text not null unique,
  role text not null check (role in ('admin', 'owner', 'store_manager', 'cashier', 'driver', 'customer')),
  name text not null,
  phone text,
  address text,
  current_suburb text,
  login_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

CREATE TABLE regions (
  id uuid primary key default uuid_generate_v4(),
  name text not null
);

CREATE TABLE restaurants (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references users(id),
  name text not null,
  logo_url text,
  cover_page_url text,
  rating numeric,
  status text not null check (status in ('pending_verification', 'active', 'suspended')),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

CREATE TABLE restaurant_locations (
  id uuid primary key default uuid_generate_v4(),
  restaurant_id uuid not null references restaurants(id),
  suburb text not null,
  street text not null,
  city text not null,
  town text,
  latitude numeric,
  longitude numeric,
  status text not null check (status in ('open', 'closed')),
  rating numeric,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

CREATE TABLE verification_documents (
  id uuid primary key default uuid_generate_v4(),
  restaurant_id uuid not null references restaurants(id),
  owner_id uuid not null references users(id),
  document_type text not null,
  file_url text not null,
  status text not null check (status in ('pending', 'approved', 'rejected')),
  submitted_at timestamp with time zone not null default now(),
  reviewed_at timestamp with time zone,
  reviewed_by uuid references users(id)
);

CREATE TABLE driver_documents (
  id uuid primary key default uuid_generate_v4(),
  driver_id uuid not null references users(id),
  document_type text not null,
  file_url text not null,
  status text not null check (status in ('pending', 'approved', 'rejected')),
  submitted_at timestamp with time zone not null default now(),
  reviewed_at timestamp with time zone,
  reviewed_by uuid references users(id)
);

CREATE TABLE menu_items (
  id uuid primary key default uuid_generate_v4(),
  restaurant_id uuid not null references restaurants(id),
  name text not null,
  description text,
  price decimal not null,
  image_url text,
  category text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

CREATE TABLE discounts (
  id uuid primary key default uuid_generate_v4(),
  restaurant_location_id uuid not null references restaurant_locations(id),
  percentage numeric not null,
  start_date date not null,
  end_date date not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

CREATE TABLE delivery_info (
  id uuid primary key default uuid_generate_v4(),
  restaurant_location_id uuid not null references restaurant_locations(id),
  speed numeric,
  estimated_time text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

CREATE TABLE driver_queue (
  id uuid primary key default uuid_generate_v4(),
  driver_id uuid not null references users(id),
  region_id uuid not null references regions(id),
  login_at timestamp with time zone not null,
  status text not null check (status in ('waiting', 'assigned', 'offline'))
);

CREATE TABLE orders (
  id uuid primary key default uuid_generate_v4(),
  restaurant_location_id uuid not null references restaurant_locations(id),
  driver_id uuid references users(id),
  customer_id uuid not null references users(id),
  status text not null check (status in ('pending', 'accepted', 'picked_up', 'delivered', 'cancelled')),
  total_amount numeric not null,
  discount_id uuid references discounts(id),
  delivery_address text not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

CREATE TABLE order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references orders(id),
  menu_item_id uuid not null references menu_items(id),
  quantity integer not null,
  unit_price numeric not null
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Create storage buckets
INSERT INTO storage.buckets (id, name) VALUES ('owner-docs', 'Owner Documents') ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name) VALUES ('driver-docs', 'Driver Documents') ON CONFLICT DO NOTHING;

-- Storage bucket policies
CREATE POLICY "Owners can upload their documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'owner-docs' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Owners can view their own documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'owner-docs' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Drivers can upload their documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'driver-docs' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Drivers can view their own documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'driver-docs' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Admins can view all documents" ON storage.objects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users
      JOIN public.users ON auth.users.id = public.users.id
      WHERE auth.users.id = auth.uid() AND public.users.role = 'admin'
    )
  );

-- Row Level Security Policies

-- Users table policies
CREATE POLICY "Users can view their own data" ON users FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users can update their own data" ON users FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Admins have full access to users" ON users USING (auth.jwt() ->> 'role' = 'admin');

-- Restaurants table policies
CREATE POLICY "Public can view active restaurants" ON restaurants FOR SELECT USING (status = 'active');
CREATE POLICY "Owners can manage their restaurants" ON restaurants USING (owner_id = auth.uid());
CREATE POLICY "Admins have full access to restaurants" ON restaurants USING (auth.jwt() ->> 'role' = 'admin');

-- Orders table policies
CREATE POLICY "Customers can view their own orders" ON orders FOR SELECT USING (customer_id = auth.uid());
CREATE POLICY "Customers can create orders" ON orders FOR INSERT WITH CHECK (customer_id = auth.uid());
CREATE POLICY "Drivers can view assigned orders" ON orders FOR SELECT USING (driver_id = auth.uid());
CREATE POLICY "Drivers can update order status" ON orders FOR UPDATE USING (driver_id = auth.uid());

-- Restaurant locations policies
CREATE POLICY "Public can view restaurant locations" ON restaurant_locations FOR SELECT USING (status = 'open');
CREATE POLICY "Restaurant owners can manage their locations" ON restaurant_locations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = restaurant_locations.restaurant_id
      AND restaurants.owner_id = auth.uid()
    )
  );

-- Menu items policies
CREATE POLICY "Public can view menu items" ON menu_items FOR SELECT USING (true);
CREATE POLICY "Restaurant owners can manage menu items" ON menu_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = menu_items.restaurant_id
      AND restaurants.owner_id = auth.uid()
    )
  );

-- Order items policies
CREATE POLICY "Customers can view their order items" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.customer_id = auth.uid()
    )
  );

-- Verification documents policies
CREATE POLICY "Owners can view their verification documents" ON verification_documents
  FOR SELECT USING (owner_id = auth.uid());
CREATE POLICY "Owners can submit verification documents" ON verification_documents
  FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Admins can review verification documents" ON verification_documents
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Driver documents policies
CREATE POLICY "Drivers can view their documents" ON driver_documents
  FOR SELECT USING (driver_id = auth.uid());
CREATE POLICY "Drivers can submit documents" ON driver_documents
  FOR INSERT WITH CHECK (driver_id = auth.uid());
CREATE POLICY "Admins can review driver documents" ON driver_documents
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Driver queue policies
CREATE POLICY "Drivers can view their queue status" ON driver_queue
  FOR SELECT USING (driver_id = auth.uid());
CREATE POLICY "Drivers can update their queue status" ON driver_queue
  FOR UPDATE USING (driver_id = auth.uid());
CREATE POLICY "Admins can manage driver queue" ON driver_queue
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Discounts policies
CREATE POLICY "Public can view active discounts" ON discounts
  FOR SELECT USING (
    start_date <= CURRENT_DATE AND end_date >= CURRENT_DATE
  );
CREATE POLICY "Restaurant owners can manage discounts" ON discounts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM restaurant_locations
      JOIN restaurants ON restaurant_locations.restaurant_id = restaurants.id
      WHERE restaurant_locations.id = discounts.restaurant_location_id
      AND restaurants.owner_id = auth.uid()
    )
  );

-- Delivery info policies
CREATE POLICY "Public can view delivery info" ON delivery_info FOR SELECT USING (true);
CREATE POLICY "Restaurant owners can manage delivery info" ON delivery_info
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM restaurant_locations
      JOIN restaurants ON restaurant_locations.restaurant_id = restaurants.id
      WHERE restaurant_locations.id = delivery_info.restaurant_location_id
      AND restaurants.owner_id = auth.uid()
    )
  );

-- Regions policies
CREATE POLICY "Public can view regions" ON regions FOR SELECT USING (true);
CREATE POLICY "Admins can manage regions" ON regions
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Database functions to bypass RLS for specific operations

-- Function to get a user profile by ID
CREATE OR REPLACE FUNCTION get_user_profile(user_id UUID)
RETURNS TABLE (
  id UUID,
  email TEXT,
  role TEXT,
  name TEXT,
  phone TEXT,
  address TEXT,
  current_suburb TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.email, u.role, u.name, u.phone, u.address, u.current_suburb, u.created_at, u.updated_at
  FROM users u
  WHERE u.id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update or insert a user profile
CREATE OR REPLACE FUNCTION update_user_profile(
  user_id UUID,
  user_email TEXT,
  user_name TEXT,
  user_role TEXT,
  user_phone TEXT,
  user_address TEXT,
  user_suburb TEXT
)
RETURNS BOOLEAN
SECURITY DEFINER
AS $$
DECLARE
  user_exists BOOLEAN;
  auth_user RECORD;
BEGIN
  -- Check if user exists
  SELECT EXISTS(SELECT 1 FROM users WHERE id = user_id) INTO user_exists;

  -- Also update the auth.users metadata to ensure consistency
  BEGIN
    UPDATE auth.users
    SET raw_user_meta_data =
      CASE
        WHEN raw_user_meta_data IS NULL THEN jsonb_build_object('name', user_name)
        ELSE jsonb_set(raw_user_meta_data, '{name}', to_jsonb(user_name))
      END
    WHERE id = user_id;
  EXCEPTION WHEN OTHERS THEN
    -- Ignore errors updating auth.users as we may not have permission
    RAISE NOTICE 'Could not update auth.users metadata: %', SQLERRM;
  END;

  IF user_exists THEN
    -- Update existing user
    UPDATE users
    SET
      name = user_name,
      role = user_role,
      phone = user_phone,
      address = user_address,
      current_suburb = user_suburb,
      updated_at = NOW()
    WHERE id = user_id;
  ELSE
    -- Insert new user
    INSERT INTO users (
      id,
      email,
      name,
      role,
      phone,
      address,
      current_suburb,
      created_at,
      updated_at
    ) VALUES (
      user_id,
      user_email,
      user_name,
      user_role,
      user_phone,
      user_address,
      user_suburb,
      NOW(),
      NOW()
    );
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
