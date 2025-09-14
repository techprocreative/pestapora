import { supabase } from './supabase';
import type { Database } from '../types/database';

type EventInsert = Database['public']['Tables']['events']['Insert'];
type EventUpdate = Database['public']['Tables']['events']['Update'];

type TicketTypeInsert = Database['public']['Tables']['ticket_types']['Insert'];

type UserProfileUpdate = Database['public']['Tables']['users']['Update'];

// Events API
export const eventsApi = {
  // Get all events with ticket types
  async getAll() {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        organizers(*),
        ticket_types(*)
      `)
      .eq('status', 'published')
      .order('starts_at', { ascending: true });

    if (error) throw error;
    return data;
  },

  // Get event by ID
  async getById(id: string) {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        organizers(*),
        ticket_types(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Search events
  async search(query: string, category?: string) {
    let queryBuilder = supabase
      .from('events')
      .select(`
        *,
        organizers(*),
        ticket_types(*)
      `)
      .eq('status', 'published');

    if (query) {
      queryBuilder = queryBuilder.or(
        `title.ilike.%${query}%,description.ilike.%${query}%,venue.ilike.%${query}%`
      );
    }

    if (category && category !== 'ALL') {
      queryBuilder = queryBuilder.eq('category', category);
    }

    const { data, error } = await queryBuilder.order('starts_at', { ascending: true });

    if (error) throw error;
    return data;
  },

  // Create event (organizer only)
  async create(event: EventInsert) {
    const { data, error } = await supabase
      .from('events')
      .insert(event)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update event (organizer only)
  async update(id: string, updates: EventUpdate) {
    const { data, error } = await supabase
      .from('events')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete event (organizer only)
  async delete(id: string) {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Get events by organizer
  async getByOrganizer(organizerId: string) {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        organizers(*),
        ticket_types(*)
      `)
      .eq('organizer_id', organizerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }
};

// Ticket Types API
export const ticketTypesApi = {
  // Get ticket types for an event
  async getByEvent(eventId: string) {
    const { data, error } = await supabase
      .from('ticket_types')
      .select('*')
      .eq('event_id', eventId)
      .order('price_cents', { ascending: true });

    if (error) throw error;
    return data;
  },

  // Create ticket type
  async create(ticketType: TicketTypeInsert) {
    const { data, error } = await supabase
      .from('ticket_types')
      .insert(ticketType)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update ticket type
  async update(id: string, updates: Partial<TicketTypeInsert>) {
    const { data, error } = await supabase
      .from('ticket_types')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Check availability
  async checkAvailability(ticketTypeId: string) {
    const { data, error } = await supabase
      .rpc('check_ticket_availability', { ticket_type_id: ticketTypeId });

    if (error) throw error;
    return data;
  }
};

// Orders API
export const ordersApi = {
  // Get user orders
  async getUserOrders(userId: string) {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        events(*),
        order_items(*,
          ticket_types(*)
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get order by ID
  async getById(orderId: string, userId: string) {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        events(*),
        order_items(*,
          ticket_types(*)
        )
      `)
      .eq('id', orderId)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  },

  // Create order with items
  async create(orderData: {
    userId: string;
    eventId: string;
    items: { ticketTypeId: string; quantity: number; unitPriceCents: number }[];
    totalCents: number;
    paymentMethod: string;
  }) {
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: orderData.userId,
        event_id: orderData.eventId,
        total_cents: orderData.totalCents,
        status: 'pending',
        payment_method: orderData.paymentMethod
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Create order items
    const orderItems = orderData.items.map(item => ({
      order_id: order.id,
      ticket_type_id: item.ticketTypeId,
      quantity: item.quantity,
      unit_price_cents: item.unitPriceCents
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;

    return order;
  },

  // Update order status
  async updateStatus(orderId: string, status: string) {
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

// Tickets API
export const ticketsApi = {
  // Get user tickets
  async getUserTickets(userId: string) {
    const { data, error } = await supabase
      .from('tickets')
      .select(`
        *,
        ticket_types(*),
        events(*),
        orders(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get ticket by ID
  async getById(ticketId: string, userId: string) {
    const { data, error } = await supabase
      .from('tickets')
      .select(`
        *,
        ticket_types(*),
        events(*),
        orders(*)
      `)
      .eq('id', ticketId)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  },

  // Create tickets for order
  async createForOrder(orderData: {
    userId: string;
    orderId: string;
    tickets: { ticketTypeId: string; quantity: number }[];
  }) {
    const tickets = [];
    
    for (const ticketGroup of orderData.tickets) {
      for (let i = 0; i < ticketGroup.quantity; i++) {
        tickets.push({
          user_id: orderData.userId,
          order_id: orderData.orderId,
          ticket_type_id: ticketGroup.ticketTypeId,
          ticket_number: `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          status: 'valid'
        });
      }
    }

    const { data, error } = await supabase
      .from('tickets')
      .insert(tickets)
      .select();

    if (error) throw error;
    return data;
  },

  // Update ticket status (for scanning)
  async updateStatus(ticketId: string, status: string) {
    const { data, error } = await supabase
      .from('tickets')
      .update({ 
        status,
        scanned_at: status === 'used' ? new Date().toISOString() : null
      })
      .eq('id', ticketId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Validate ticket by number
  async validateByNumber(ticketNumber: string) {
    const { data, error } = await supabase
      .from('tickets')
      .select(`
        *,
        ticket_types(*),
        events(*)
      `)
      .eq('ticket_number', ticketNumber)
      .single();

    if (error) throw error;
    return data;
  }
};

// User Profile API
export const userApi = {
  // Get user profile
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  },

  // Update user profile
  async updateProfile(userId: string, updates: UserProfileUpdate) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get user statistics
  async getStats(userId: string) {
    const [ordersResult, ticketsResult] = await Promise.all([
      supabase
        .from('orders')
        .select('id, total_cents, status')
        .eq('user_id', userId),
      supabase
        .from('tickets')
        .select('id, status')
        .eq('user_id', userId)
    ]);

    if (ordersResult.error) throw ordersResult.error;
    if (ticketsResult.error) throw ticketsResult.error;

    const orders = ordersResult.data || [];
    const tickets = ticketsResult.data || [];

    return {
      totalOrders: orders.length,
      totalSpent: orders
        .filter(o => o.status === 'paid')
        .reduce((sum, o) => sum + o.total_cents, 0) / 100,
      totalTickets: tickets.length,
      usedTickets: tickets.filter(t => t.status === 'used').length
    };
  }
};

// Reservations API (for cart holds)
export const reservationsApi = {
  // Create reservation
  async create(data: {
    userId: string;
    ticketTypeId: string;
    quantity: number;
    expiresAt: string;
  }) {
    const { data: reservation, error } = await supabase
      .from('reservations')
      .insert({
        user_id: data.userId,
        ticket_type_id: data.ticketTypeId,
        quantity: data.quantity,
        expires_at: data.expiresAt,
        status: 'active'
      })
      .select()
      .single();

    if (error) throw error;
    return reservation;
  },

  // Release reservation
  async release(reservationId: string) {
    const { error } = await supabase
      .from('reservations')
      .update({ status: 'released' })
      .eq('id', reservationId);

    if (error) throw error;
  },

  // Get user reservations
  async getUserReservations(userId: string) {
    const { data, error } = await supabase
      .from('reservations')
      .select(`
        *,
        ticket_types(*,
          events(*)
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }
};