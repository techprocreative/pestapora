-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizers ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- Users table policies
-- Users can view and update their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Admins can view all users
CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Organizers table policies
-- Organizers can view and manage their own organizer profiles
CREATE POLICY "Organizers can view own organizer" ON organizers
  FOR SELECT USING (owner_user_id = auth.uid());

CREATE POLICY "Organizers can update own organizer" ON organizers
  FOR UPDATE USING (owner_user_id = auth.uid());

CREATE POLICY "Organizers can create organizer" ON organizers
  FOR INSERT WITH CHECK (owner_user_id = auth.uid());

-- Admins can view all organizers
CREATE POLICY "Admins can view all organizers" ON organizers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Events table policies
-- Everyone can view published events
CREATE POLICY "Anyone can view published events" ON events
  FOR SELECT USING (status = 'published');

-- Organizers can manage their own events
CREATE POLICY "Organizers can manage own events" ON events
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM organizers
      WHERE id = events.organizer_id AND owner_user_id = auth.uid()
    )
  );

-- Staff can view events they're assigned to (for future gate scanning)
CREATE POLICY "Staff can view assigned events" ON events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('staff', 'admin')
    )
  );

-- Ticket types table policies
-- Everyone can view ticket types for published events
CREATE POLICY "Anyone can view ticket types for published events" ON ticket_types
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE id = ticket_types.event_id AND status = 'published'
    )
  );

-- Organizers can manage ticket types for their events
CREATE POLICY "Organizers can manage own ticket types" ON ticket_types
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM events e
      JOIN organizers o ON e.organizer_id = o.id
      WHERE e.id = ticket_types.event_id AND o.owner_user_id = auth.uid()
    )
  );

-- Orders table policies
-- Users can view their own orders
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (user_id = auth.uid());

-- Users can create orders for themselves
CREATE POLICY "Users can create own orders" ON orders
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own orders (for payment status)
CREATE POLICY "Users can update own orders" ON orders
  FOR UPDATE USING (user_id = auth.uid());

-- Organizers can view orders for their events
CREATE POLICY "Organizers can view orders for own events" ON orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM events e
      JOIN organizers o ON e.organizer_id = o.id
      WHERE e.id = orders.event_id AND o.owner_user_id = auth.uid()
    )
  );

-- Admins can view all orders
CREATE POLICY "Admins can view all orders" ON orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Order items table policies
-- Users can view order items for their own orders
CREATE POLICY "Users can view own order items" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE id = order_items.order_id AND user_id = auth.uid()
    )
  );

-- Users can create order items for their own orders
CREATE POLICY "Users can create own order items" ON order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE id = order_items.order_id AND user_id = auth.uid()
    )
  );

-- Organizers can view order items for their events
CREATE POLICY "Organizers can view order items for own events" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders o
      JOIN events e ON o.event_id = e.id
      JOIN organizers org ON e.organizer_id = org.id
      WHERE o.id = order_items.order_id AND org.owner_user_id = auth.uid()
    )
  );

-- Tickets table policies
-- Users can view their own tickets
CREATE POLICY "Users can view own tickets" ON tickets
  FOR SELECT USING (user_id = auth.uid());

-- Staff can view tickets for events they're assigned to (for scanning)
CREATE POLICY "Staff can view tickets for assigned events" ON tickets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('staff', 'admin')
    )
  );

-- Staff can update tickets (for marking as used)
CREATE POLICY "Staff can update tickets for scanning" ON tickets
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('staff', 'admin')
    )
  );

-- Organizers can view tickets for their events
CREATE POLICY "Organizers can view tickets for own events" ON tickets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM events e
      JOIN organizers o ON e.organizer_id = o.id
      WHERE e.id = tickets.event_id AND o.owner_user_id = auth.uid()
    )
  );

-- System can create tickets (for payment processing)
CREATE POLICY "System can create tickets" ON tickets
  FOR INSERT WITH CHECK (true);

-- Reservations table policies
-- Users can view their own reservations
CREATE POLICY "Users can view own reservations" ON reservations
  FOR SELECT USING (user_id = auth.uid());

-- Users can create their own reservations
CREATE POLICY "Users can create own reservations" ON reservations
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own reservations
CREATE POLICY "Users can update own reservations" ON reservations
  FOR UPDATE USING (user_id = auth.uid());

-- System can cleanup expired reservations
CREATE POLICY "System can cleanup reservations" ON reservations
  FOR UPDATE USING (true);

-- Organizers can view reservations for their events
CREATE POLICY "Organizers can view reservations for own events" ON reservations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM events e
      JOIN organizers o ON e.organizer_id = o.id
      WHERE e.id = reservations.event_id AND o.owner_user_id = auth.uid()
    )
  );