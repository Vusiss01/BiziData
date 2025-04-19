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
