-- Migration: Add payment integration columns to orders table
-- Run this after the main schema.sql

-- Add payment-related columns to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS customer_email TEXT,
ADD COLUMN IF NOT EXISTS customer_name TEXT,
ADD COLUMN IF NOT EXISTS billing_address JSONB;

-- Add payment status to order_status enum if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
        CREATE TYPE order_status AS ENUM ('created', 'pending', 'paid', 'cancelled', 'refunded');
    ELSE
        -- Add new values to existing enum
        ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'pending';
        ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'paid';
        ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'cancelled';
        ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'refunded';
    END IF;
END $$;

-- Add QR code column to tickets table
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS qr_code TEXT;

-- Create index for payment lookups
CREATE INDEX IF NOT EXISTS idx_orders_stripe_payment_intent ON orders(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_tickets_qr_code ON tickets(qr_code);

-- Update tickets table to include event_id reference
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES events(id) ON DELETE CASCADE;

-- Create function to automatically set event_id in tickets based on order
CREATE OR REPLACE FUNCTION set_ticket_event_id()
RETURNS TRIGGER AS $$
BEGIN
    -- Get event_id from the order
    SELECT o.event_id INTO NEW.event_id
    FROM orders o
    WHERE o.id = NEW.order_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically set event_id when ticket is created
DROP TRIGGER IF EXISTS trigger_set_ticket_event_id ON tickets;
CREATE TRIGGER trigger_set_ticket_event_id
    BEFORE INSERT ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION set_ticket_event_id();

-- Create function to update inventory when order is paid
CREATE OR REPLACE FUNCTION update_inventory_on_payment()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update inventory when status changes to 'paid'
    IF NEW.status = 'paid' AND OLD.status != 'paid' THEN
        -- Decrease remaining inventory for each order item
        UPDATE ticket_types 
        SET remaining_inventory = remaining_inventory - oi.quantity
        FROM order_items oi
        WHERE oi.order_id = NEW.id 
        AND ticket_types.id = oi.ticket_type_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update inventory when order is paid
DROP TRIGGER IF EXISTS trigger_update_inventory_on_payment ON orders;
CREATE TRIGGER trigger_update_inventory_on_payment
    AFTER UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_inventory_on_payment();

COMMIT;