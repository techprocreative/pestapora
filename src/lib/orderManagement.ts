import { supabase } from './supabase';
import type { Database } from '../types/database';

type Order = Database['public']['Tables']['orders']['Row'];
type OrderInsert = Database['public']['Tables']['orders']['Insert'];
type OrderUpdate = Database['public']['Tables']['orders']['Update'];
type OrderStatus = Database['public']['Enums']['order_status'];

export interface OrderWithDetails extends Order {
  order_items: {
    id: string;
    quantity: number;
    price_cents: number;
    ticket_type: {
      id: string;
      name: string;
      price_cents: number;
    };
  }[];
  event: {
    id: string;
    title: string;
    date: string;
    venue: string;
    image_url: string;
  };
  tickets: {
    id: string;
    ticket_number: string;
    code: string;
    qr_code: string | null;
    status: string;
  }[];
}

export class OrderManager {
  /**
   * Create a new order
   */
  static async createOrder(orderData: OrderInsert): Promise<Order> {
    const { data, error } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create order: ${error.message}`);
    }

    return data;
  }

  /**
   * Update order status
   */
  static async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    additionalData?: Partial<OrderUpdate>
  ): Promise<Order> {
    const updateData: OrderUpdate = {
      status,
      ...additionalData,
    };

    // Add paid_at timestamp when status is 'paid'
    if (status === 'paid') {
      updateData.paid_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update order status: ${error.message}`);
    }

    return data;
  }

  /**
   * Get order by ID with full details
   */
  static async getOrderWithDetails(orderId: string): Promise<OrderWithDetails | null> {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          quantity,
          price_cents,
          ticket_type:ticket_types (
            id,
            name,
            price_cents
          )
        ),
        event:events (
          id,
          title,
          date,
          venue,
          image_url
        ),
        tickets (
          id,
          ticket_number,
          code,
          qr_code,
          status
        )
      `)
      .eq('id', orderId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Order not found
      }
      throw new Error(`Failed to get order: ${error.message}`);
    }

    return data as OrderWithDetails;
  }

  /**
   * Get orders by user ID
   */
  static async getOrdersByUser(
    userId: string,
    status?: OrderStatus
  ): Promise<OrderWithDetails[]> {
    let query = supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          quantity,
          price_cents,
          ticket_type:ticket_types (
            id,
            name,
            price_cents
          )
        ),
        event:events (
          id,
          title,
          date,
          venue,
          image_url
        ),
        tickets (
          id,
          ticket_number,
          code,
          qr_code,
          status
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get user orders: ${error.message}`);
    }

    return data as OrderWithDetails[];
  }

  /**
   * Cancel order
   */
  static async cancelOrder(orderId: string): Promise<Order> {
    // First check if order can be cancelled
    const order = await this.getOrderWithDetails(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    if (order.status === 'paid') {
      throw new Error('Cannot cancel paid order. Please request refund instead.');
    }

    if (order.status === 'cancelled') {
      throw new Error('Order is already cancelled');
    }

    return this.updateOrderStatus(orderId, 'cancelled');
  }

  /**
   * Mark order as expired
   */
  static async expireOrder(orderId: string): Promise<Order> {
    return this.updateOrderStatus(orderId, 'expired');
  }

  /**
   * Process refund for paid order
   */
  static async refundOrder(orderId: string): Promise<Order> {
    const order = await this.getOrderWithDetails(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    if (order.status !== 'paid') {
      throw new Error('Only paid orders can be refunded');
    }

    // TODO: Implement actual refund processing with Stripe
    // For now, just update status
    return this.updateOrderStatus(orderId, 'refunded');
  }

  /**
   * Get order statistics
   */
  static async getOrderStats(eventId?: string) {
    let query = supabase
      .from('orders')
      .select('status, total_cents');

    if (eventId) {
      query = query.eq('event_id', eventId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get order stats: ${error.message}`);
    }

    const stats = {
      total: data.length,
      pending: data.filter(o => o.status === 'pending').length,
      paid: data.filter(o => o.status === 'paid').length,
      cancelled: data.filter(o => o.status === 'cancelled').length,
      expired: data.filter(o => o.status === 'expired').length,
      refunded: data.filter(o => o.status === 'refunded').length,
      totalRevenue: data
        .filter(o => o.status === 'paid')
        .reduce((sum, o) => sum + o.total_cents, 0),
    };

    return stats;
  }

  /**
   * Check for expired orders and mark them as expired
   */
  static async processExpiredOrders(): Promise<number> {
    const { data, error } = await supabase
      .from('orders')
      .select('id')
      .eq('status', 'pending')
      .lt('expires_at', new Date().toISOString());

    if (error) {
      throw new Error(`Failed to get expired orders: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return 0;
    }

    const { error: updateError } = await supabase
      .from('orders')
      .update({ status: 'expired' })
      .in('id', data.map(o => o.id));

    if (updateError) {
      throw new Error(`Failed to expire orders: ${updateError.message}`);
    }

    return data.length;
  }
}

// Order status flow helpers
export const ORDER_STATUS_FLOW = {
  created: ['pending', 'pending_payment', 'cancelled'],
  pending: ['paid', 'cancelled', 'expired'],
  pending_payment: ['paid', 'cancelled', 'expired'],
  paid: ['refunded'],
  confirmed: ['cancelled'],
  cancelled: [], // Terminal state
  expired: [], // Terminal state
  refunded: [], // Terminal state
} as const;

export function canTransitionTo(currentStatus: OrderStatus, newStatus: OrderStatus): boolean {
  const allowedTransitions = ORDER_STATUS_FLOW[currentStatus as keyof typeof ORDER_STATUS_FLOW];
  return allowedTransitions ? allowedTransitions.includes(newStatus as any) : false;
}

export function isTerminalStatus(status: OrderStatus): boolean {
  return ['cancelled', 'expired', 'refunded'].includes(status);
}

export function isPaidStatus(status: OrderStatus): boolean {
  return status === 'paid';
}

export function getOrderStatusLabel(status: OrderStatus): string {
  const statusMap = {
    created: 'Dibuat',
    pending: 'Menunggu',
    pending_payment: 'Menunggu Pembayaran',
    paid: 'Dibayar',
    confirmed: 'Dikonfirmasi',
    cancelled: 'Dibatalkan',
    expired: 'Kedaluwarsa',
    refunded: 'Dikembalikan',
  };
  
  return statusMap[status] || status;
}