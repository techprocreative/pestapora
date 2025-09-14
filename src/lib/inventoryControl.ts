import { supabase } from './supabase';
import type { Database } from '../types/database';

type TicketType = Database['public']['Tables']['ticket_types']['Row'];

export interface InventoryStatus {
  ticketTypeId: string;
  name: string;
  totalCapacity: number;
  soldTickets: number;
  reservedTickets: number;
  availableTickets: number;
  isAvailable: boolean;
  isSoldOut: boolean;
}

export interface InventoryCheck {
  success: boolean;
  available: boolean;
  requestedQuantity: number;
  availableQuantity: number;
  message?: string;
}

export class InventoryManager {
  /**
   * Get current inventory status for a ticket type
   */
  static async getInventoryStatus(ticketTypeId: string): Promise<InventoryStatus> {
    // Get ticket type info
    const { data: ticketType, error: ticketTypeError } = await supabase
      .from('ticket_types')
      .select('*')
      .eq('id', ticketTypeId)
      .single();

    if (ticketTypeError) {
      throw new Error(`Failed to get ticket type: ${ticketTypeError.message}`);
    }

    // Get sold tickets count (from paid orders)
    const { data: soldTickets, error: soldError } = await supabase
      .from('order_items')
      .select(`
        quantity,
        order:orders!inner(
          status
        )
      `)
      .eq('ticket_type_id', ticketTypeId)
      .eq('order.status', 'paid');

    if (soldError) {
      throw new Error(`Failed to get sold tickets: ${soldError.message}`);
    }

    // Get reserved tickets count (from pending orders that haven't expired)
    const { data: reservedTickets, error: reservedError } = await supabase
      .from('order_items')
      .select(`
        quantity,
        order:orders!inner(
          status,
          expires_at
        )
      `)
      .eq('ticket_type_id', ticketTypeId)
      .eq('order.status', 'pending')
      .gt('order.expires_at', new Date().toISOString());

    if (reservedError) {
      throw new Error(`Failed to get reserved tickets: ${reservedError.message}`);
    }

    // Calculate totals
    const soldCount = soldTickets?.reduce((sum, item) => sum + item.quantity, 0) || 0;
    const reservedCount = reservedTickets?.reduce((sum, item) => sum + item.quantity, 0) || 0;
    const availableCount = Math.max(0, ticketType.capacity - soldCount - reservedCount);

    return {
      ticketTypeId: ticketType.id,
      name: ticketType.name,
      totalCapacity: ticketType.capacity,
      soldTickets: soldCount,
      reservedTickets: reservedCount,
      availableTickets: availableCount,
      isAvailable: availableCount > 0 && ticketType.is_available,
      isSoldOut: availableCount === 0,
    };
  }

  /**
   * Get inventory status for all ticket types of an event
   */
  static async getEventInventoryStatus(eventId: string): Promise<InventoryStatus[]> {
    const { data: ticketTypes, error } = await supabase
      .from('ticket_types')
      .select('id')
      .eq('event_id', eventId)
      .eq('is_available', true);

    if (error) {
      throw new Error(`Failed to get ticket types: ${error.message}`);
    }

    const inventoryPromises = ticketTypes.map(tt => 
      this.getInventoryStatus(tt.id)
    );

    return Promise.all(inventoryPromises);
  }

  /**
   * Check if requested quantity is available for purchase
   */
  static async checkAvailability(
    ticketTypeId: string,
    requestedQuantity: number
  ): Promise<InventoryCheck> {
    try {
      const inventory = await this.getInventoryStatus(ticketTypeId);

      if (!inventory.isAvailable) {
        return {
          success: true,
          available: false,
          requestedQuantity,
          availableQuantity: 0,
          message: 'Ticket type is not available for sale',
        };
      }

      if (inventory.isSoldOut) {
        return {
          success: true,
          available: false,
          requestedQuantity,
          availableQuantity: 0,
          message: 'Ticket type is sold out',
        };
      }

      if (requestedQuantity > inventory.availableTickets) {
        return {
          success: true,
          available: false,
          requestedQuantity,
          availableQuantity: inventory.availableTickets,
          message: `Only ${inventory.availableTickets} tickets available`,
        };
      }

      return {
        success: true,
        available: true,
        requestedQuantity,
        availableQuantity: inventory.availableTickets,
        message: 'Tickets available',
      };
    } catch (error) {
      return {
        success: false,
        available: false,
        requestedQuantity,
        availableQuantity: 0,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check availability for multiple ticket types
   */
  static async checkMultipleAvailability(
    items: { ticketTypeId: string; quantity: number }[]
  ): Promise<{ [ticketTypeId: string]: InventoryCheck }> {
    const checks = await Promise.all(
      items.map(async item => ({
        ticketTypeId: item.ticketTypeId,
        check: await this.checkAvailability(item.ticketTypeId, item.quantity),
      }))
    );

    return checks.reduce((acc, { ticketTypeId, check }) => {
      acc[ticketTypeId] = check;
      return acc;
    }, {} as { [ticketTypeId: string]: InventoryCheck });
  }

  /**
   * Reserve tickets (when creating pending order)
   * This doesn't actually change inventory but creates a pending order
   * that will be counted in reserved tickets
   */
  static async reserveTickets(
    items: { ticketTypeId: string; quantity: number }[]
  ): Promise<boolean> {
    // Check availability for all items first
    const availabilityChecks = await this.checkMultipleAvailability(items);
    
    // Verify all items are available
    for (const item of items) {
      const check = availabilityChecks[item.ticketTypeId];
      if (!check.success || !check.available) {
        throw new Error(
          `Cannot reserve tickets for ${item.ticketTypeId}: ${check.message}`
        );
      }
    }

    return true; // Reservation successful
  }

  /**
   * Release reserved tickets (when order expires or is cancelled)
   * This happens automatically when order status changes
   */
  static async releaseReservation(orderId: string): Promise<void> {
    // Get order items to release
    const { data: orderItems, error } = await supabase
      .from('order_items')
      .select('ticket_type_id, quantity')
      .eq('order_id', orderId);

    if (error) {
      throw new Error(`Failed to get order items: ${error.message}`);
    }

    // No need to do anything special - the inventory calculation
    // automatically excludes expired/cancelled orders
    console.log(`Released reservation for order ${orderId}:`, orderItems);
  }

  /**
   * Update ticket type availability
   */
  static async updateTicketTypeAvailability(
    ticketTypeId: string,
    isAvailable: boolean
  ): Promise<TicketType> {
    const { data, error } = await supabase
      .from('ticket_types')
      .update({ is_available: isAvailable })
      .eq('id', ticketTypeId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update ticket type availability: ${error.message}`);
    }

    return data;
  }

  /**
   * Update ticket type capacity
   */
  static async updateTicketTypeCapacity(
    ticketTypeId: string,
    newCapacity: number
  ): Promise<TicketType> {
    // Check if new capacity is valid (not less than sold tickets)
    const inventory = await this.getInventoryStatus(ticketTypeId);
    
    if (newCapacity < inventory.soldTickets) {
      throw new Error(
        `Cannot set capacity to ${newCapacity}. ${inventory.soldTickets} tickets already sold.`
      );
    }

    const { data, error } = await supabase
      .from('ticket_types')
      .update({ capacity: newCapacity })
      .eq('id', ticketTypeId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update ticket type capacity: ${error.message}`);
    }

    return data;
  }

  /**
   * Get low stock alerts (tickets with less than specified threshold)
   */
  static async getLowStockAlerts(
    eventId: string,
    threshold: number = 10
  ): Promise<InventoryStatus[]> {
    const inventoryStatuses = await this.getEventInventoryStatus(eventId);
    
    return inventoryStatuses.filter(
      status => status.isAvailable && 
                status.availableTickets <= threshold && 
                status.availableTickets > 0
    );
  }

  /**
   * Get sold out ticket types
   */
  static async getSoldOutTicketTypes(eventId: string): Promise<InventoryStatus[]> {
    const inventoryStatuses = await this.getEventInventoryStatus(eventId);
    
    return inventoryStatuses.filter(status => status.isSoldOut);
  }

  /**
   * Clean up expired reservations
   * This is typically called by a scheduled job
   */
  static async cleanupExpiredReservations(): Promise<number> {
    const { data: expiredOrders, error } = await supabase
      .from('orders')
      .select('id')
      .eq('status', 'pending')
      .lt('expires_at', new Date().toISOString());

    if (error) {
      throw new Error(`Failed to get expired orders: ${error.message}`);
    }

    if (!expiredOrders || expiredOrders.length === 0) {
      return 0;
    }

    // Update expired orders to 'expired' status
    const { error: updateError } = await supabase
      .from('orders')
      .update({ status: 'expired' })
      .in('id', expiredOrders.map(o => o.id));

    if (updateError) {
      throw new Error(`Failed to expire orders: ${updateError.message}`);
    }

    return expiredOrders.length;
  }
}

// Utility functions
export function formatInventoryStatus(status: InventoryStatus): string {
  if (status.isSoldOut) {
    return 'Sold Out';
  }
  
  if (status.availableTickets <= 5) {
    return `Only ${status.availableTickets} left`;
  }
  
  if (status.availableTickets <= 20) {
    return `${status.availableTickets} available`;
  }
  
  return 'Available';
}

export function getInventoryColor(status: InventoryStatus): string {
  if (status.isSoldOut) {
    return 'red';
  }
  
  if (status.availableTickets <= 5) {
    return 'orange';
  }
  
  if (status.availableTickets <= 20) {
    return 'yellow';
  }
  
  return 'green';
}