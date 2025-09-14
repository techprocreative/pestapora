export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          role: 'customer' | 'staff' | 'organizer' | 'admin'
          created_at: string
        }
        Insert: {
          id: string
          email: string
          name: string
          role?: 'customer' | 'staff' | 'organizer' | 'admin'
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: 'customer' | 'staff' | 'organizer' | 'admin'
          created_at?: string
        }
      }
      organizers: {
        Row: {
          id: string
          name: string
          slug: string
          owner_user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          owner_user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          owner_user_id?: string
          created_at?: string
        }
      }
      events: {
        Row: {
          id: string
          organizer_id: string
          title: string
          description: string
          starts_at: string
          ends_at: string
          venue: string
          address: string
          status: 'draft' | 'published' | 'cancelled' | 'completed'
          image_url: string | null
          capacity: number
          is_featured: boolean
          tags: string[] | null
          created_at: string
        }
        Insert: {
          id?: string
          organizer_id: string
          title: string
          description: string
          starts_at: string
          ends_at: string
          venue: string
          address: string
          status?: 'draft' | 'published' | 'cancelled' | 'completed'
          image_url?: string | null
          capacity: number
          is_featured?: boolean
          tags?: string[] | null
          created_at?: string
        }
        Update: {
          id?: string
          organizer_id?: string
          title?: string
          description?: string
          starts_at?: string
          ends_at?: string
          venue?: string
          address?: string
          status?: 'draft' | 'published' | 'cancelled' | 'completed'
          image_url?: string | null
          capacity?: number
          is_featured?: boolean
          tags?: string[] | null
          created_at?: string
        }
      }
      ticket_types: {
        Row: {
          id: string
          event_id: string
          name: string
          description: string
          price_cents: number
          currency: string
          max_per_order: number
          initial_inventory: number
          remaining_inventory: number
          color: string
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          name: string
          description: string
          price_cents: number
          currency?: string
          max_per_order?: number
          initial_inventory: number
          remaining_inventory: number
          color?: string
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          name?: string
          description?: string
          price_cents?: number
          currency?: string
          max_per_order?: number
          initial_inventory?: number
          remaining_inventory?: number
          color?: string
          created_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          user_id: string
          event_id: string
          status: 'created' | 'pending_payment' | 'paid' | 'cancelled' | 'expired' | 'refunded'
          subtotal_cents: number
          fees_cents: number
          total_cents: number
          currency: string
          created_at: string
          expires_at: string | null
          payment_method: string | null
          stripe_payment_intent_id: string | null
          paid_at: string | null
          customer_email: string | null
          customer_name: string | null
          billing_address: Json | null
        }
        Insert: {
          id?: string
          user_id: string
          event_id: string
          status?: 'cancelled' | 'confirmed' | 'created' | 'expired' | 'pending' | 'paid' | 'refunded'
          subtotal_cents: number
          fees_cents: number
          total_cents: number
          currency?: string
          created_at?: string
          expires_at?: string | null
          payment_method?: string | null
          stripe_payment_intent_id?: string | null
          paid_at?: string | null
          customer_email?: string | null
          customer_name?: string | null
          billing_address?: Json | null
        }
        Update: {
          id?: string
          user_id?: string
          event_id?: string
          status?: 'cancelled' | 'confirmed' | 'created' | 'expired' | 'pending' | 'pending_payment' | 'paid' | 'refunded'
          subtotal_cents?: number
          fees_cents?: number
          total_cents?: number
          currency?: string
          created_at?: string
          expires_at?: string | null
          payment_method?: string | null
          stripe_payment_intent_id?: string | null
          paid_at?: string | null
          customer_email?: string | null
          customer_name?: string | null
          billing_address?: Json | null
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          ticket_type_id: string
          quantity: number
          unit_price_cents: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          ticket_type_id: string
          quantity: number
          unit_price_cents: number
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          ticket_type_id?: string
          quantity?: number
          unit_price_cents?: number
          created_at?: string
        }
      }
      tickets: {
        Row: {
          id: string
          order_id: string
          event_id: string
          ticket_type_id: string
          user_id: string
          status: 'issued' | 'active' | 'used' | 'void'
          code: string
          qr_payload: string
          issued_at: string
          used_at: string | null
          used_gate_id: string | null
          qr_code: string | null
        }
        Insert: {
          id?: string
          order_id: string
          event_id: string
          ticket_type_id: string
          user_id: string
          status?: 'issued' | 'active' | 'used' | 'void'
          code: string
          qr_payload: string
          issued_at?: string
          used_at?: string | null
          used_gate_id?: string | null
          qr_code?: string | null
        }
        Update: {
          id?: string
          order_id?: string
          event_id?: string
          ticket_type_id?: string
          user_id?: string
          status?: 'issued' | 'active' | 'used' | 'void'
          code?: string
          qr_payload?: string
          issued_at?: string
          used_at?: string | null
          used_gate_id?: string | null
          qr_code?: string | null
        }
      }
      reservations: {
        Row: {
          id: string
          user_id: string
          event_id: string
          ticket_type_id: string
          quantity: number
          expires_at: string
          status: 'active' | 'released' | 'converted'
          order_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          event_id: string
          ticket_type_id: string
          quantity: number
          expires_at: string
          status?: 'active' | 'released' | 'converted'
          order_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          event_id?: string
          ticket_type_id?: string
          quantity?: number
          expires_at?: string
          status?: 'active' | 'released' | 'converted'
          order_id?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'customer' | 'staff' | 'organizer' | 'admin'
      event_status: 'draft' | 'published' | 'cancelled' | 'completed'
      order_status: 'cancelled' | 'confirmed' | 'created' | 'expired' | 'pending' | 'paid' | 'refunded'
      ticket_status: 'issued' | 'active' | 'used' | 'void'
      reservation_status: 'active' | 'released' | 'converted'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}