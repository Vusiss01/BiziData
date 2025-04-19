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
