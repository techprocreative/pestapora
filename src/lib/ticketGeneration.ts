import { supabase } from './supabase';
import type { Database } from '../types/database';

type Ticket = Database['public']['Tables']['tickets']['Row'];
type TicketInsert = Database['public']['Tables']['tickets']['Insert'];

export interface TicketData {
  id: string;
  orderId: string;
  ticketNumber: string;
  code: string;
  qrCode: string;
  status: string;
  eventTitle: string;
  eventDate: string;
  eventVenue: string;
  ticketTypeName: string;
  customerName: string;
  customerEmail: string;
  orderTotal: number;
}

export interface QRCodeData {
  ticketId: string;
  code: string;
  eventId: string;
  userId: string;
  validFrom: string;
  validUntil: string;
}

export interface TicketValidationResult {
  valid: boolean;
  ticket?: TicketData;
  message: string;
  usedAt?: string;
}

/**
 * Ticket Generation and Management System
 */
export class TicketGenerator {
  /**
   * Generate tickets for a paid order
   */
  static async generateTicketsForOrder(orderId: string): Promise<Ticket[]> {
    try {
      // Get order details
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            ticket_type:ticket_types(*)
          ),
          event:events(*)
        `)
        .eq('id', orderId)
        .single();

      if (orderError || !order) {
        throw new Error(`Order not found: ${orderError?.message}`);
      }

      if (order.status !== 'paid') {
        throw new Error('Can only generate tickets for paid orders');
      }

      // Check if tickets already exist
      const { data: existingTickets } = await supabase
        .from('tickets')
        .select('id')
        .eq('order_id', orderId);

      if (existingTickets && existingTickets.length > 0) {
        throw new Error('Tickets already generated for this order');
      }

      const tickets: TicketInsert[] = [];
      
      // Generate tickets for each order item
      for (const item of order.order_items) {
        for (let i = 0; i < item.quantity; i++) {
          const ticketData = this.generateTicketData(order);
          
          tickets.push({
            order_id: orderId,
            ticket_type_id: item.ticket_type_id,
            user_id: order.user_id,
            event_id: order.event_id,
            qr_payload: ticketData.qrCode,
            code: ticketData.code,
            qr_code: ticketData.qrCode,
            status: 'active',
          });
        }
      }

      // Insert tickets into database
      const { data: createdTickets, error: ticketError } = await supabase
        .from('tickets')
        .insert(tickets)
        .select();

      if (ticketError) {
        throw new Error(`Failed to create tickets: ${ticketError.message}`);
      }

      console.log(`Generated ${createdTickets.length} tickets for order: ${orderId}`);
      return createdTickets;
    } catch (error) {
      console.error('Error generating tickets:', error);
      throw error;
    }
  }

  /**
   * Generate individual ticket data
   */
  private static generateTicketData(order: Record<string, unknown>) {
    // Generate unique ticket number
    const event = order.event as { title: string; date: string };
    const eventCode = event.title.substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    const ticketNumber = `${eventCode}-${timestamp}-${random}`;

    // Generate unique verification code
    const code = this.generateVerificationCode();

    // Generate QR code data URL
    const qrData: QRCodeData = {
      ticketId: '', // Will be set after insertion
      code: code,
      eventId: order.event_id as string,
      userId: order.user_id as string,
      validFrom: event.date,
      validUntil: new Date(new Date(event.date).getTime() + 24 * 60 * 60 * 1000).toISOString(), // Valid for 24 hours after event
    };

    const qrCodeUrl = this.generateQRCodeUrl(qrData);

    return {
      ticketNumber,
      code,
      qrCode: qrCodeUrl,
    };
  }

  /**
   * Generate unique verification code
   */
  private static generateVerificationCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Generate QR code URL
   */
  private static generateQRCodeUrl(qrData: QRCodeData): string {
    // In a real implementation, you might use a QR code generation service
    // For now, we'll create a verification URL
    const baseUrl = 'https://pestapora.com';
    const verificationUrl = `${baseUrl}/verify/${qrData.code}`;
    
    // You could also encode additional data in the QR code
    const encodedData = btoa(JSON.stringify({
      code: qrData.code,
      eventId: qrData.eventId,
      validFrom: qrData.validFrom,
      validUntil: qrData.validUntil,
    }));
    
    return `${verificationUrl}?data=${encodedData}`;
  }

  /**
   * Get ticket details by ID
   */
  static async getTicketDetails(ticketId: string): Promise<TicketData | null> {
    try {
      const { data: ticket, error } = await supabase
        .from('tickets')
        .select(`
          *,
          ticket_type:ticket_types(*),
          event:events(*),
          order:orders(*)
        `)
        .eq('id', ticketId)
        .single();

      if (error || !ticket) {
        return null;
      }

      return {
        id: ticket.id,
        orderId: ticket.order_id,
        ticketNumber: ticket.ticket_number,
        code: ticket.code,
        qrCode: ticket.qr_code || '',
        status: ticket.status,
        eventTitle: ticket.event.title,
        eventDate: ticket.event.date,
        eventVenue: ticket.event.venue,
        ticketTypeName: ticket.ticket_type.name,
        customerName: ticket.order.customer_name || '',
        customerEmail: ticket.order.customer_email || '',
        orderTotal: ticket.order.total_cents,
      };
    } catch (error) {
      console.error('Error getting ticket details:', error);
      return null;
    }
  }

  /**
   * Get tickets by user ID
   */
  static async getUserTickets(userId: string): Promise<TicketData[]> {
    try {
      const { data: tickets, error } = await supabase
        .from('tickets')
        .select(`
          *,
          ticket_type:ticket_types(*),
          event:events(*),
          order:orders(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to get user tickets: ${error.message}`);
      }

      return tickets.map(ticket => ({
        id: ticket.id,
        orderId: ticket.order_id,
        ticketNumber: ticket.ticket_number,
        code: ticket.code,
        qrCode: ticket.qr_code || '',
        status: ticket.status,
        eventTitle: ticket.event.title,
        eventDate: ticket.event.date,
        eventVenue: ticket.event.venue,
        ticketTypeName: ticket.ticket_type.name,
        customerName: ticket.order.customer_name || '',
        customerEmail: ticket.order.customer_email || '',
        orderTotal: ticket.order.total_cents,
      }));
    } catch (error) {
      console.error('Error getting user tickets:', error);
      throw error;
    }
  }

  /**
   * Validate ticket by verification code
   */
  static async validateTicket(code: string): Promise<TicketValidationResult> {
    try {
      const { data: ticket, error } = await supabase
        .from('tickets')
        .select(`
          *,
          ticket_type:ticket_types(*),
          event:events(*),
          order:orders(*)
        `)
        .eq('code', code)
        .single();

      if (error || !ticket) {
        return {
          valid: false,
          message: 'Ticket not found or invalid code',
        };
      }

      // Check if ticket is already used
      if (ticket.status === 'used') {
        return {
          valid: false,
          message: 'Ticket has already been used',
          usedAt: ticket.used_at || undefined,
        };
      }

      // Check if ticket is void
      if (ticket.status === 'void') {
        return {
          valid: false,
          message: 'Ticket is void (order was refunded or cancelled)',
        };
      }

      // Check if event date is valid
      const eventDate = new Date(ticket.event.date);
      const now = new Date();
      const eventEndTime = new Date(eventDate.getTime() + 24 * 60 * 60 * 1000); // Event valid for 24 hours

      if (now > eventEndTime) {
        return {
          valid: false,
          message: 'Ticket has expired (event date has passed)',
        };
      }

      // Ticket is valid
      const ticketData: TicketData = {
        id: ticket.id,
        orderId: ticket.order_id,
        ticketNumber: ticket.ticket_number,
        code: ticket.code,
        qrCode: ticket.qr_code || '',
        status: ticket.status,
        eventTitle: ticket.event.title,
        eventDate: ticket.event.date,
        eventVenue: ticket.event.venue,
        ticketTypeName: ticket.ticket_type.name,
        customerName: ticket.order.customer_name || '',
        customerEmail: ticket.order.customer_email || '',
        orderTotal: ticket.order.total_cents,
      };

      return {
        valid: true,
        ticket: ticketData,
        message: 'Ticket is valid',
      };
    } catch (error) {
      console.error('Error validating ticket:', error);
      return {
        valid: false,
        message: 'Error validating ticket',
      };
    }
  }

  /**
   * Use/redeem a ticket
   */
  static async useTicket(code: string, gateId?: string): Promise<TicketValidationResult> {
    try {
      // First validate the ticket
      const validation = await this.validateTicket(code);
      
      if (!validation.valid || !validation.ticket) {
        return validation;
      }

      // Mark ticket as used
      const { error } = await supabase
        .from('tickets')
        .update({
          status: 'used',
          used_at: new Date().toISOString(),
          used_gate_id: gateId || null,
        })
        .eq('code', code);

      if (error) {
        throw new Error(`Failed to mark ticket as used: ${error.message}`);
      }

      return {
        valid: true,
        ticket: {
          ...validation.ticket,
          status: 'used',
        },
        message: 'Ticket successfully used',
        usedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error using ticket:', error);
      return {
        valid: false,
        message: 'Error processing ticket',
      };
    }
  }

  /**
   * Void tickets (when order is refunded)
   */
  static async voidTickets(orderId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ status: 'void' })
        .eq('order_id', orderId);

      if (error) {
        throw new Error(`Failed to void tickets: ${error.message}`);
      }

      console.log(`Voided tickets for order: ${orderId}`);
    } catch (error) {
      console.error('Error voiding tickets:', error);
      throw error;
    }
  }

  /**
   * Get ticket statistics for an event
   */
  static async getTicketStats(eventId: string) {
    try {
      const { data: tickets, error } = await supabase
        .from('tickets')
        .select('status')
        .eq('event_id', eventId);

      if (error) {
        throw new Error(`Failed to get ticket stats: ${error.message}`);
      }

      const stats = {
        total: tickets.length,
        active: tickets.filter(t => t.status === 'active').length,
        used: tickets.filter(t => t.status === 'used').length,
        void: tickets.filter(t => t.status === 'void').length,
        usageRate: tickets.length > 0 ? (tickets.filter(t => t.status === 'used').length / tickets.length) * 100 : 0,
      };

      return stats;
    } catch (error) {
      console.error('Error getting ticket stats:', error);
      throw error;
    }
  }

  /**
   * Generate ticket PDF (placeholder)
   */
  static async generateTicketPDF(ticketId: string): Promise<string> {
    try {
      const ticketData = await this.getTicketDetails(ticketId);
      
      if (!ticketData) {
        throw new Error('Ticket not found');
      }

      // In a real implementation, this would generate a PDF using a library like jsPDF
      // For now, return a placeholder URL
      const pdfUrl = `https://pestapora.com/tickets/${ticketId}/download`;
      
      console.log(`Generated PDF for ticket: ${ticketId}`);
      return pdfUrl;
    } catch (error) {
      console.error('Error generating ticket PDF:', error);
      throw error;
    }
  }
}

// Utility functions
export function formatTicketStatus(status: string): string {
  const statusMap = {
    active: 'Aktif',
    used: 'Sudah Digunakan',
    void: 'Dibatalkan',
    issued: 'Diterbitkan',
  };
  
  return statusMap[status as keyof typeof statusMap] || status;
}

export function getTicketStatusColor(status: string): string {
  const colorMap = {
    active: 'green',
    used: 'blue',
    void: 'red',
    issued: 'yellow',
  };
  
  return colorMap[status as keyof typeof colorMap] || 'gray';
}

export function isTicketValid(ticket: TicketData): boolean {
  if (ticket.status !== 'active') {
    return false;
  }
  
  const eventDate = new Date(ticket.eventDate);
  const now = new Date();
  const eventEndTime = new Date(eventDate.getTime() + 24 * 60 * 60 * 1000);
  
  return now <= eventEndTime;
}