import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Event, User, CartItem, Order, Seat } from '../types';
import { mockEvents } from '../data/mockEvents';

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
  
  // Auth actions
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  
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

const mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@pestapora.com',
    name: 'ADMIN PESTAPORA',
    isOrganizer: true,
    orders: []
  }
];

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

      // Auth actions
      login: async (email, password) => {
        const user = mockUsers.find(u => u.email === email);
        if (user && password === 'pestapora123') {
          set({ user, isAuthenticated: true });
          return true;
        }
        return false;
      },

      logout: () => set({ user: null, isAuthenticated: false }),

      register: async (email, _password, name) => {
        const newUser: User = {
          id: Date.now().toString(),
          email,
          name: name.toUpperCase(),
          isOrganizer: false,
          orders: []
        };
        mockUsers.push(newUser);
        set({ user: newUser, isAuthenticated: true });
        return true;
      },

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
        if (!user) throw new Error('User not authenticated');

        const order: Order = {
          id: Date.now().toString(),
          userId: user.id,
          eventId: cart[0]?.eventId || '',
          tickets: cart,
          total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
          status: 'confirmed',
          paymentMethod: paymentData.method || 'Unknown',
          createdAt: new Date(),
          qrCode: `QR-${Date.now()}`
        };

        // Clear cart after successful payment
        set({ cart: [] });
        
        return order;
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