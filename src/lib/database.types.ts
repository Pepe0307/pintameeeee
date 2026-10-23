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
      products: {
        Row: {
          id: string
          created_at: string
          title: string | null
          artist: string | null
          price: number | null
          currency: string | null
          image_url: string | null
          category: string | null
          available: boolean | null
          featured: boolean | null
          description: string | null
          dimensions: string | null
          tags: string[] | null
          gallery_images: string[] | null
        }
        Insert: {
          id?: string
          created_at?: string
          title?: string | null
          artist?: string | null
          price?: number | null
          currency?: string | null
          image_url?: string | null
          category?: string | null
          available?: boolean | null
          featured?: boolean | null
          description?: string | null
          dimensions?: string | null
          tags?: string[] | null
          gallery_images?: string[] | null
        }
        Update: {
          id?: string
          created_at?: string
          title?: string | null
          artist?: string | null
          price?: number | null
          currency?: string | null
          image_url?: string | null
          category?: string | null
          available?: boolean | null
          featured?: boolean | null
          description?: string | null
          dimensions?: string | null
          tags?: string[] | null
          gallery_images?: string[] | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          id: string
          status: string
          amount: number
          currency: string
          items: Json
          description: string | null
          bold_payment_id: string | null
          payer_email: string | null
          payment_method: string | null
          last_event: string | null
          note: string | null
          customer_name: string | null
          customer_email: string | null
          customer_phone: string | null
          shipping_address: string | null
          shipping_city: string | null
          shipping_department: string | null
          shipping_notes: string | null
          test_mode: boolean
          created_at: string
          updated_at: string
          paid_at: string | null
        }
        Insert: {
          id: string
          status?: string
          amount: number
          currency?: string
          items: Json
          description?: string | null
          bold_payment_id?: string | null
          payer_email?: string | null
          payment_method?: string | null
          last_event?: string | null
          note?: string | null
          customer_name?: string | null
          customer_email?: string | null
          customer_phone?: string | null
          shipping_address?: string | null
          shipping_city?: string | null
          shipping_department?: string | null
          shipping_notes?: string | null
          test_mode?: boolean
          created_at?: string
          updated_at?: string
          paid_at?: string | null
        }
        Update: {
          id?: string
          status?: string
          amount?: number
          currency?: string
          items?: Json
          description?: string | null
          bold_payment_id?: string | null
          payer_email?: string | null
          payment_method?: string | null
          last_event?: string | null
          note?: string | null
          customer_name?: string | null
          customer_email?: string | null
          customer_phone?: string | null
          shipping_address?: string | null
          shipping_city?: string | null
          shipping_department?: string | null
          shipping_notes?: string | null
          test_mode?: boolean
          created_at?: string
          updated_at?: string
          paid_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      mark_order_paid: {
        Args: {
          p_order_id: string
          p_payment_id: string
          p_amount: number
          p_currency: string
          p_payer_email: string | null
          p_payment_method: string | null
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
