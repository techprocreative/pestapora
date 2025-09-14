import { loadStripe } from '@stripe/stripe-js';
import { supabase } from './supabase';
import { OrderManager } from './orderManagement';
import { InventoryManager } from './inventoryControl';
import { CartItem } from '../types';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

export interface PaymentIntent {
  id: string;
  client_secret: string;
  amount: number;
  currency: string;
  status: string;
}

export interface CreateOrderRequest {
  cart: CartItem[];
  customerInfo: {
    email: string;
    fullName: string;
    address: string;
    city: string;
    zipCode: string;
  };
}

export interface CreateOrderResponse {
  orderId: string;
  clientSecret: string;
  amount: number;
}

/**
 * Create a new order and payment intent
 */
export async function createOrder(request: CreateOrderRequest): Promise<CreateOrderResponse> {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Check inventory availability first
    const inventoryItems = request.cart.map(item => ({
      ticketTypeId: item.ticketTypeId,
      quantity: item.quantity,
    }));

    await InventoryManager.reserveTickets(inventoryItems);

    // Calculate total amount in cents (IDR)
    const totalCents = request.cart.reduce((sum, item) => {
      return sum + (item.price * item.quantity * 100);
    }, 0);

    // Add service fee (10%)
    const serviceFee = Math.round(totalCents * 0.1);
    const finalTotal = totalCents + serviceFee;

    // Create order using OrderManager
    const orderData = await OrderManager.createOrder({
      user_id: user.id,
      event_id: request.cart[0]?.eventId, // Assuming single event per order
      total_cents: finalTotal,
      status: 'pending',
      payment_method: 'stripe',
      customer_email: request.customerInfo.email,
      customer_name: request.customerInfo.fullName,
      billing_address: {
        address: request.customerInfo.address,
        city: request.customerInfo.city,
        zipCode: request.customerInfo.zipCode
      }
    });

    // Create order items
    const orderItems = request.cart.map(item => ({
      order_id: orderData.id,
      ticket_type_id: item.ticketTypeId,
      quantity: item.quantity,
      unit_price_cents: item.price * 100
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Order items creation error:', itemsError);
      throw new Error('Failed to create order items');
    }

    // Create Stripe Payment Intent
    const paymentIntent = await createPaymentIntent({
      amount: finalTotal,
      currency: 'idr',
      orderId: orderData.id,
      customerEmail: request.customerInfo.email
    });

    // Update order with payment intent ID using OrderManager
    await OrderManager.updateOrderStatus(orderData.id, 'pending', {
      stripe_payment_intent_id: paymentIntent.id
    });

    return {
      orderId: orderData.id,
      clientSecret: paymentIntent.client_secret,
      amount: finalTotal
    };
  } catch (error) {
    console.error('Create order error:', error);
    throw error;
  }
}

/**
 * Create Stripe Payment Intent
 */
export async function createPaymentIntent(params: {
  amount: number;
  currency: string;
  orderId: string;
  customerEmail: string;
}): Promise<PaymentIntent> {
  try {
    // In a real implementation, this would call your backend API
    // For now, we'll simulate the Stripe Payment Intent creation
    
    // This should be done on your backend server, not in the frontend
    // Here's a mock implementation for development
    const mockPaymentIntent: PaymentIntent = {
      id: `pi_mock_${Date.now()}`,
      client_secret: `pi_mock_${Date.now()}_secret_mock`,
      amount: params.amount,
      currency: params.currency,
      status: 'requires_payment_method'
    };

    return mockPaymentIntent;
  } catch (error) {
    console.error('Payment intent creation error:', error);
    throw new Error('Failed to create payment intent');
  }
}

/**
 * Confirm payment and update order status
 */
export async function confirmPayment(orderId: string): Promise<void> {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Update order status to paid using OrderManager
    await OrderManager.updateOrderStatus(orderId, 'paid');

    // Get order items to create tickets
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId);

    if (itemsError || !orderItems) {
      console.error('Order items fetch error:', itemsError);
      throw new Error('Failed to fetch order items');
    }

    // Create tickets for each order item
    const tickets = [];
    for (const item of orderItems) {
      for (let i = 0; i < item.quantity; i++) {
        tickets.push({
          user_id: user.id,
          order_id: orderId,
          ticket_type_id: item.ticket_type_id,
          ticket_number: `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          status: 'valid',
          qr_code: `QR-${orderId}-${item.ticket_type_id}-${i}`
        });
      }
    }

    const { error: ticketsError } = await supabase
      .from('tickets')
      .insert(tickets);

    if (ticketsError) {
      console.error('Tickets creation error:', ticketsError);
      throw new Error('Failed to create tickets');
    }

    console.log('Payment confirmed and tickets created successfully');
  } catch (error) {
    console.error('Confirm payment error:', error);
    throw error;
  }
}

/**
 * Get order details
 */
export async function getOrder(orderId: string) {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const order = await OrderManager.getOrderWithDetails(orderId);
    return order;
  } catch (error) {
    console.error('Get order error:', error);
    throw error;
  }
}

export { stripePromise };