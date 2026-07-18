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
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
