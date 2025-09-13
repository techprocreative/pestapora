export interface Event {
  id: string;
  title: string;
  description: string;
  date: Date;
  time: string;
  venue: string;
  address: string;
  category: EventCategory;
  image: string;
  organizer: string;
  ticketTypes: TicketType[];
  totalSeats: number;
  bookedSeats: string[];
  isFeatured: boolean;
  tags: string[];
}

export interface TicketType {
  id: string;
  name: string;
  price: number;
  description: string;
  maxQuantity: number;
  available: number;
  color: string;
}

export interface CartItem {
  eventId: string;
  ticketTypeId: string;
  quantity: number;
  seatNumbers?: string[];
  price: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  isOrganizer: boolean;
  orders: Order[];
}

export interface Order {
  id: string;
  userId: string;
  eventId: string;
  tickets: CartItem[];
  total: number;
  status: 'confirmed' | 'pending' | 'cancelled';
  paymentMethod: string;
  createdAt: Date;
  qrCode?: string;
}

export type EventCategory = 
  | 'TECHNOLOGY' 
  | 'MUSIC' 
  | 'BUSINESS' 
  | 'GAMING' 
  | 'ART' 
  | 'SPORTS' 
  | 'FOOD';

export interface Seat {
  id: string;
  row: string;
  number: number;
  isBooked: boolean;
  isSelected: boolean;
  price: number;
}