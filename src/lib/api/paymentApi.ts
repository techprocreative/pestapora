import { supabase } from '../supabase';
import { OrderManager } from '../orderManagement';
import type { Database } from '../../types/database';

export interface PaymentWebhookData {
  type: string;
  data: {
    object: {
      id: string;
      status: string;
      amount: number;
      currency: string;
      metadata?: Record<string, string>;
    };
  };
}

export interface CreatePaymentIntentRequest {
  orderId: string;
  amount: number;
  currency: string;
  customerEmail: string;
  customerName: string;
}

export interface CreatePaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
}

export interface PaymentStatus {
  orderId: string;
  status: 'pending' | 'paid' | 'failed' | 'cancelled';
  paymentIntentId?: string;
  amount: number;
  currency: string;
  paidAt?: string;
}

/**
 * Payment API class for handling payment-related operations
 */
export class PaymentAPI {
  /**
   * Create payment intent for an order
   */
  static async createPaymentIntent(
    request: CreatePaymentIntentRequest
  ): Promise<CreatePaymentIntentResponse> {
    try {
      // Verify order exists and is in correct state
      const order = await OrderManager.getOrderWithDetails(request.orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      if (order.status !== 'pending') {
        throw new Error(`Cannot create payment intent for order with status: ${order.status}`);
      }

      // Check if order has expired
      if (order.expires_at && new Date(order.expires_at) < new Date()) {
        await OrderManager.updateOrderStatus(request.orderId, 'expired');
        throw new Error('Order has expired');
      }

      // Verify amount matches order total
      if (request.amount !== order.total_cents) {
        throw new Error('Amount mismatch');
      }

      // In a real implementation, this would call Stripe API
      // For demo purposes, we'll simulate the response
      const paymentIntentId = `pi_${Math.random().toString(36).substr(2, 24)}`;
      const clientSecret = `${paymentIntentId}_secret_${Math.random().toString(36).substr(2, 16)}`;

      // Update order with payment intent ID
      await OrderManager.updateOrderStatus(request.orderId, 'pending', {
        stripe_payment_intent_id: paymentIntentId,
        payment_method: 'stripe',
      });

      return {
        clientSecret,
        paymentIntentId,
      };
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  }

  /**
   * Handle Stripe webhook events
   */
  static async handleWebhook(webhookData: PaymentWebhookData): Promise<void> {
    try {
      const { type, data } = webhookData;
      const paymentIntent = data.object;

      switch (type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSuccess(paymentIntent.id);
          break;

        case 'payment_intent.payment_failed':
          await this.handlePaymentFailure(paymentIntent.id);
          break;

        case 'payment_intent.canceled':
          await this.handlePaymentCancellation(paymentIntent.id);
          break;

        default:
          console.log(`Unhandled webhook event type: ${type}`);
      }
    } catch (error) {
      console.error('Error handling webhook:', error);
      throw error;
    }
  }

  /**
   * Handle successful payment
   */
  private static async handlePaymentSuccess(paymentIntentId: string): Promise<void> {
    try {
      // Find order by payment intent ID
      const { data: order, error } = await supabase
        .from('orders')
        .select('*')
        .eq('stripe_payment_intent_id', paymentIntentId)
        .single();

      if (error || !order) {
        throw new Error(`Order not found for payment intent: ${paymentIntentId}`);
      }

      // Update order status to paid
      await OrderManager.updateOrderStatus(order.id, 'paid');

      // Generate tickets
      await this.generateTicketsForOrder(order.id);

      // Send confirmation email (placeholder)
      await this.sendOrderConfirmationEmail(order.id);

      console.log(`Payment successful for order: ${order.id}`);
    } catch (error) {
      console.error('Error handling payment success:', error);
      throw error;
    }
  }

  /**
   * Handle failed payment
   */
  private static async handlePaymentFailure(paymentIntentId: string): Promise<void> {
    try {
      // Find order by payment intent ID
      const { data: order, error } = await supabase
        .from('orders')
        .select('*')
        .eq('stripe_payment_intent_id', paymentIntentId)
        .single();

      if (error || !order) {
        console.log(`Order not found for failed payment intent: ${paymentIntentId}`);
        return;
      }

      // Keep order as pending to allow retry
      console.log(`Payment failed for order: ${order.id}`);
    } catch (error) {
      console.error('Error handling payment failure:', error);
      throw error;
    }
  }

  /**
   * Handle payment cancellation
   */
  private static async handlePaymentCancellation(paymentIntentId: string): Promise<void> {
    try {
      // Find order by payment intent ID
      const { data: order, error } = await supabase
        .from('orders')
        .select('*')
        .eq('stripe_payment_intent_id', paymentIntentId)
        .single();

      if (error || !order) {
        console.log(`Order not found for cancelled payment intent: ${paymentIntentId}`);
        return;
      }

      // Cancel the order
      await OrderManager.updateOrderStatus(order.id, 'cancelled');

      console.log(`Payment cancelled for order: ${order.id}`);
    } catch (error) {
      console.error('Error handling payment cancellation:', error);
      throw error;
    }
  }

  /**
   * Get payment status for an order
   */
  static async getPaymentStatus(orderId: string): Promise<PaymentStatus> {
    try {
      const order = await OrderManager.getOrderWithDetails(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      return {
        orderId: order.id,
        status: this.mapOrderStatusToPaymentStatus(order.status),
        paymentIntentId: order.stripe_payment_intent_id || undefined,
        amount: order.total_cents,
        currency: order.currency,
        paidAt: order.paid_at || undefined,
      };
    } catch (error) {
      console.error('Error getting payment status:', error);
      throw error;
    }
  }

  /**
   * Process refund for a paid order
   */
  static async processRefund(
    orderId: string,
    amount?: number
  ): Promise<{ success: boolean; refundId?: string }> {
    try {
      const order = await OrderManager.getOrderWithDetails(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      if (order.status !== 'paid') {
        throw new Error('Only paid orders can be refunded');
      }

      const refundAmount = amount || order.total_cents;
      
      // In a real implementation, this would call Stripe refund API
      // For demo purposes, we'll simulate the refund
      const refundId = `re_${Math.random().toString(36).substr(2, 24)}`;

      // Update order status to refunded
      await OrderManager.updateOrderStatus(orderId, 'refunded');

      // Mark tickets as void
      await supabase
        .from('tickets')
        .update({ status: 'void' })
        .eq('order_id', orderId);

      console.log(`Refund processed for order: ${orderId}, amount: ${refundAmount}`);

      return {
        success: true,
        refundId,
      };
    } catch (error) {
      console.error('Error processing refund:', error);
      return {
        success: false,
      };
    }
  }

  /**
   * Generate tickets for a paid order
   */
  private static async generateTicketsForOrder(orderId: string): Promise<void> {
    try {
      // Get order items
      const { data: orderItems, error } = await supabase
        .from('order_items')
        .select(`
          *,
          ticket_type:ticket_types(*),
          order:orders(*)
        `)
        .eq('order_id', orderId);

      if (error || !orderItems) {
        throw new Error(`Failed to get order items: ${error?.message}`);
      }

      const tickets = [];
      
      for (const item of orderItems) {
        for (let i = 0; i < item.quantity; i++) {
          const ticketNumber = `${item.order.event_id.slice(-4).toUpperCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
          const code = Math.random().toString(36).substr(2, 12).toUpperCase();
          const qrCode = `https://pestapora.com/verify/${code}`;

          tickets.push({
            order_id: orderId,
            ticket_type_id: item.ticket_type_id,
            user_id: item.order.user_id,
            event_id: item.order.event_id,
            ticket_number: ticketNumber,
            code: code,
            qr_code: qrCode,
            status: 'active',
          });
        }
      }

      // Insert tickets
      const { error: ticketError } = await supabase
        .from('tickets')
        .insert(tickets);

      if (ticketError) {
        throw new Error(`Failed to create tickets: ${ticketError.message}`);
      }

      console.log(`Generated ${tickets.length} tickets for order: ${orderId}`);
    } catch (error) {
      console.error('Error generating tickets:', error);
      throw error;
    }
  }

  /**
   * Send order confirmation email (placeholder)
   */
  private static async sendOrderConfirmationEmail(orderId: string): Promise<void> {
    try {
      // This would integrate with an email service like SendGrid, Mailgun, etc.
      // For now, just log the action
      console.log(`Sending confirmation email for order: ${orderId}`);
      
      // TODO: Implement actual email sending
      // - Get order details
      // - Generate email template
      // - Send via email service
    } catch (error) {
      console.error('Error sending confirmation email:', error);
      // Don't throw error as this shouldn't fail the payment process
    }
  }

  /**
   * Map order status to payment status
   */
  private static mapOrderStatusToPaymentStatus(
    orderStatus: Database['public']['Enums']['order_status']
  ): PaymentStatus['status'] {
    switch (orderStatus) {
      case 'pending':
        return 'pending';
      case 'paid':
        return 'paid';
      case 'cancelled':
        return 'cancelled';
      case 'expired':
        return 'failed';
      case 'refunded':
        return 'cancelled';
      default:
        return 'pending';
    }
  }

  /**
   * Clean up expired orders (to be called by scheduled job)
   */
  static async cleanupExpiredOrders(): Promise<number> {
    try {
      const expiredCount = await OrderManager.processExpiredOrders();
      console.log(`Cleaned up ${expiredCount} expired orders`);
      return expiredCount;
    } catch (error) {
      console.error('Error cleaning up expired orders:', error);
      throw error;
    }
  }

  /**
   * Get payment analytics
   */
  static async getPaymentAnalytics(eventId?: string) {
    try {
      const stats = await OrderManager.getOrderStats(eventId);
      
      return {
        totalOrders: stats.total,
        paidOrders: stats.paid,
        pendingOrders: stats.pending,
        cancelledOrders: stats.cancelled,
        expiredOrders: stats.expired,
        refundedOrders: stats.refunded,
        totalRevenue: stats.totalRevenue,
        conversionRate: stats.total > 0 ? (stats.paid / stats.total) * 100 : 0,
      };
    } catch (error) {
      console.error('Error getting payment analytics:', error);
      throw error;
    }
  }
}

// Export utility functions
export function formatCurrency(amountCents: number, currency: string = 'IDR'): string {
  const amount = amountCents / 100;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
  }).format(amount);
}

export function validatePaymentAmount(amount: number): boolean {
  return amount > 0 && amount <= 100000000; // Max 1 billion IDR
}

export function generateOrderReference(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `ORD-${timestamp}-${random}`;
}