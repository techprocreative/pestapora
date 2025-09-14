import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Event, User, CartItem, Order, Seat } from '../types';
import { mockEvents } from '../data/mockEvents';
import { supabase } from '../lib/supabase';


interface PaymentData {
  cardNumber?: string;
  expiryDate?: string;
  cvv?: string;
  cardholderName?: string;
  method?: string;
  amount?: number;
  cardLast4?: string;
}

interface AppState {
  // Events
  events: Event[];
  filteredEvents: Event[];
  selectedEvent: Event | null;
  
  // User & Auth
  user: User | null;
  isAuthenticated: boolean;
  
  // Cart & Tickets
  cart: CartItem[];
  selectedSeats: Seat[];
  
  // UI State
  showSeatSelection: boolean;
  searchQuery: string;
  selectedCategory: string;
  
  // Actions
  setEvents: (events: Event[]) => void;
  setSelectedEvent: (event: Event | null) => void;
  filterEvents: (query: string, category: string) => void;
  
  // Auth actions (now handled by AuthContext)
  // login, logout, register moved to AuthContext
  
  // Cart actions
  addToCart: (item: CartItem) => void;
  removeFromCart: (eventId: string, ticketTypeId: string) => void;
  updateCartQuantity: (eventId: string, ticketTypeId: string, quantity: number) => void;
  clearCart: () => void;
  
  // Seat selection
  setShowSeatSelection: (show: boolean) => void;
  selectSeat: (seat: Seat) => void;
  deselectSeat: (seatId: string) => void;
  clearSelectedSeats: () => void;
  
  // Checkout
  processPayment: (paymentData: PaymentData) => Promise<Order>;
}

// Mock users removed - now using Supabase Auth

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      events: mockEvents,
      filteredEvents: mockEvents,
      selectedEvent: null,
      user: null,
      isAuthenticated: false,
      cart: [],
      selectedSeats: [],
      showSeatSelection: false,
      searchQuery: '',
      selectedCategory: '',

      // Event actions
      setEvents: (events) => set({ events, filteredEvents: events }),
      
      setSelectedEvent: (event) => set({ selectedEvent: event }),
      
      filterEvents: (query, category) => {
        const { events } = get();
        let filtered = events;
        
        if (query) {
          filtered = filtered.filter(event => 
            event.title.toLowerCase().includes(query.toLowerCase()) ||
            event.description.toLowerCase().includes(query.toLowerCase()) ||
            event.venue.toLowerCase().includes(query.toLowerCase())
          );
        }
        
        if (category && category !== 'ALL') {
          filtered = filtered.filter(event => event.category === category);
        }
        
        set({ filteredEvents: filtered, searchQuery: query, selectedCategory: category });
      },

      // Auth actions moved to AuthContext
      // User state will be synced from AuthContext

      // Cart actions
      addToCart: (item) => {
        const { cart } = get();
        const existingItem = cart.find(
          cartItem => cartItem.eventId === item.eventId && cartItem.ticketTypeId === item.ticketTypeId
        );

        if (existingItem) {
          set({
            cart: cart.map(cartItem =>
              cartItem.eventId === item.eventId && cartItem.ticketTypeId === item.ticketTypeId
                ? { ...cartItem, quantity: cartItem.quantity + item.quantity }
                : cartItem
            )
          });
        } else {
          set({ cart: [...cart, item] });
        }
      },

      removeFromCart: (eventId, ticketTypeId) => {
        const { cart } = get();
        set({
          cart: cart.filter(
            item => !(item.eventId === eventId && item.ticketTypeId === ticketTypeId)
          )
        });
      },

      updateCartQuantity: (eventId, ticketTypeId, quantity) => {
        const { cart } = get();
        if (quantity <= 0) {
          get().removeFromCart(eventId, ticketTypeId);
          return;
        }
        
        set({
          cart: cart.map(item =>
            item.eventId === eventId && item.ticketTypeId === ticketTypeId
              ? { ...item, quantity }
              : item
          )
        });
      },

      clearCart: () => set({ cart: [] }),

      // Seat selection
      setShowSeatSelection: (show) => set({ showSeatSelection: show }),
      
      selectSeat: (seat) => {
        const { selectedSeats } = get();
        if (!selectedSeats.find(s => s.id === seat.id)) {
          set({ selectedSeats: [...selectedSeats, { ...seat, isSelected: true }] });
        }
      },

      deselectSeat: (seatId) => {
        const { selectedSeats } = get();
        set({ selectedSeats: selectedSeats.filter(seat => seat.id !== seatId) });
      },

      clearSelectedSeats: () => set({ selectedSeats: [] }),

      // Checkout
      processPayment: async (paymentData) => {
        const { cart, user } = get();
        
        if (!user || cart.length === 0) {
          throw new Error('Invalid payment data');
        }

        try {
          // Create order in Supabase
          const totalCents = cart.reduce((sum, item) => sum + (item.price * item.quantity * 100), 0);
          
          const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .insert({
              user_id: user.id,
              event_id: cart[0]?.eventId, // Assuming single event per order for now
              total_cents: totalCents,
              status: 'paid',
              payment_method: paymentData.method || 'card'
            })
            .select()
            .single();

          if (orderError) throw orderError;

          // Create order items
          const orderItems = cart.map(item => ({
            order_id: orderData.id,
            ticket_type_id: item.ticketTypeId,
            quantity: item.quantity,
            unit_price_cents: item.price * 100
          }));

          const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItems);

          if (itemsError) throw itemsError;

          // Create tickets
          const tickets = [];
          for (const item of cart) {
            for (let i = 0; i < item.quantity; i++) {
              tickets.push({
                user_id: user.id,
                order_id: orderData.id,
                ticket_type_id: item.ticketTypeId,
                ticket_number: `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                status: 'valid'
              });
            }
          }

          const { error: ticketsError } = await supabase
            .from('tickets')
            .insert(tickets);

          if (ticketsError) throw ticketsError;

          const order: Order = {
            id: orderData.id,
            userId: user.id,
            eventId: cart[0]?.eventId || '',
            tickets: cart,
            total: totalCents / 100,
            status: 'confirmed',
            paymentMethod: paymentData.method || 'card',
            createdAt: new Date(orderData.created_at),
            qrCode: `QR-${orderData.id}`
          };

          set({ cart: [] });
          return order;
        } catch (error) {
          console.error('Payment processing error:', error);
          throw new Error('Pembayaran gagal diproses');
        }
      },
    }),
    {
      name: 'pestapora-tickets-store',
      partialize: (state) => ({
        cart: state.cart,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);