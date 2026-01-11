export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      articles: {
        Row: {
          ai_summary: string | null
          author_id: string | null
          category: string
          comment_count: number | null
          content: string | null
          content_type: string | null
          created_at: string | null
          excerpt: string | null
          id: string
          image_url: string | null
          is_breaking: boolean | null
          is_featured: boolean | null
          neighborhood_id: string | null
          published_at: string | null
          slug: string | null
          source_name: string
          source_url: string | null
          status: string | null
          title: string
          updated_at: string | null
          upvotes: number | null
          view_count: number | null
        }
        Insert: {
          ai_summary?: string | null
          author_id?: string | null
          category: string
          comment_count?: number | null
          content?: string | null
          content_type?: string | null
          created_at?: string | null
          excerpt?: string | null
          id?: string
          image_url?: string | null
          is_breaking?: boolean | null
          is_featured?: boolean | null
          neighborhood_id?: string | null
          published_at?: string | null
          slug?: string | null
          source_name: string
          source_url?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          upvotes?: number | null
          view_count?: number | null
        }
        Update: {
          ai_summary?: string | null
          author_id?: string | null
          category?: string
          comment_count?: number | null
          content?: string | null
          content_type?: string | null
          created_at?: string | null
          excerpt?: string | null
          id?: string
          image_url?: string | null
          is_breaking?: boolean | null
          is_featured?: boolean | null
          neighborhood_id?: string | null
          published_at?: string | null
          slug?: string | null
          source_name?: string
          source_url?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          upvotes?: number | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "articles_neighborhood_id_fkey"
            columns: ["neighborhood_id"]
            isOneToOne: false
            referencedRelation: "neighborhoods"
            referencedColumns: ["id"]
          },
        ]
      }
      business_categories: {
        Row: {
          display_order: number | null
          icon: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          display_order?: number | null
          icon?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          display_order?: number | null
          icon?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      businesses: {
        Row: {
          address: string | null
          category: string
          city: string | null
          claimed: boolean | null
          claimed_by: string | null
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          email: string | null
          gallery_urls: string[] | null
          hours: Json | null
          id: string
          is_featured: boolean | null
          logo_url: string | null
          name: string
          neighborhood_id: string | null
          phone: string | null
          price_level: number | null
          rating: number | null
          review_count: number | null
          short_description: string | null
          slug: string
          state: string | null
          status: string | null
          subcategories: string[] | null
          updated_at: string | null
          verified: boolean | null
          view_count: number | null
          website: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          category: string
          city?: string | null
          claimed?: boolean | null
          claimed_by?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          gallery_urls?: string[] | null
          hours?: Json | null
          id?: string
          is_featured?: boolean | null
          logo_url?: string | null
          name: string
          neighborhood_id?: string | null
          phone?: string | null
          price_level?: number | null
          rating?: number | null
          review_count?: number | null
          short_description?: string | null
          slug: string
          state?: string | null
          status?: string | null
          subcategories?: string[] | null
          updated_at?: string | null
          verified?: boolean | null
          view_count?: number | null
          website?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          category?: string
          city?: string | null
          claimed?: boolean | null
          claimed_by?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          gallery_urls?: string[] | null
          hours?: Json | null
          id?: string
          is_featured?: boolean | null
          logo_url?: string | null
          name?: string
          neighborhood_id?: string | null
          phone?: string | null
          price_level?: number | null
          rating?: number | null
          review_count?: number | null
          short_description?: string | null
          slug?: string
          state?: string | null
          status?: string | null
          subcategories?: string[] | null
          updated_at?: string | null
          verified?: boolean | null
          view_count?: number | null
          website?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "businesses_neighborhood_id_fkey"
            columns: ["neighborhood_id"]
            isOneToOne: false
            referencedRelation: "neighborhoods"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          author_id: string
          body: string
          content_id: string
          content_type: string
          created_at: string | null
          downvotes: number | null
          id: string
          parent_id: string | null
          status: string | null
          updated_at: string | null
          upvotes: number | null
        }
        Insert: {
          author_id: string
          body: string
          content_id: string
          content_type: string
          created_at?: string | null
          downvotes?: number | null
          id?: string
          parent_id?: string | null
          status?: string | null
          updated_at?: string | null
          upvotes?: number | null
        }
        Update: {
          author_id?: string
          body?: string
          content_id?: string
          content_type?: string
          created_at?: string | null
          downvotes?: number | null
          id?: string
          parent_id?: string | null
          status?: string | null
          updated_at?: string | null
          upvotes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          end_time: string | null
          id: string
          image_url: string | null
          is_featured: boolean | null
          location_address: string | null
          location_name: string | null
          neighborhood_id: string | null
          organizer_id: string | null
          organizer_name: string | null
          price_max: number | null
          price_min: number | null
          price_type: string | null
          save_count: number | null
          short_description: string | null
          slug: string | null
          source_type: string | null
          start_time: string
          status: string | null
          ticket_url: string | null
          title: string
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          end_time?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          location_address?: string | null
          location_name?: string | null
          neighborhood_id?: string | null
          organizer_id?: string | null
          organizer_name?: string | null
          price_max?: number | null
          price_min?: number | null
          price_type?: string | null
          save_count?: number | null
          short_description?: string | null
          slug?: string | null
          source_type?: string | null
          start_time: string
          status?: string | null
          ticket_url?: string | null
          title: string
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          end_time?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          location_address?: string | null
          location_name?: string | null
          neighborhood_id?: string | null
          organizer_id?: string | null
          organizer_name?: string | null
          price_max?: number | null
          price_min?: number | null
          price_type?: string | null
          save_count?: number | null
          short_description?: string | null
          slug?: string | null
          source_type?: string | null
          start_time?: string
          status?: string | null
          ticket_url?: string | null
          title?: string
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "events_neighborhood_id_fkey"
            columns: ["neighborhood_id"]
            isOneToOne: false
            referencedRelation: "neighborhoods"
            referencedColumns: ["id"]
          },
        ]
      }
      neighborhoods: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          image_url: string | null
          name: string
          slug: string
          zip_codes: string[] | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          name: string
          slug: string
          zip_codes?: string[] | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          name?: string
          slug?: string
          zip_codes?: string[] | null
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          breaking_news: boolean | null
          created_at: string | null
          daily_digest: boolean | null
          email: string
          id: string
          status: string | null
          unsubscribed_at: string | null
          user_id: string | null
          verification_token: string | null
          verified_at: string | null
          weekly_newsletter: boolean | null
        }
        Insert: {
          breaking_news?: boolean | null
          created_at?: string | null
          daily_digest?: boolean | null
          email: string
          id?: string
          status?: string | null
          unsubscribed_at?: string | null
          user_id?: string | null
          verification_token?: string | null
          verified_at?: string | null
          weekly_newsletter?: boolean | null
        }
        Update: {
          breaking_news?: boolean | null
          created_at?: string | null
          daily_digest?: boolean | null
          email?: string
          id?: string
          status?: string | null
          unsubscribed_at?: string | null
          user_id?: string | null
          verification_token?: string | null
          verified_at?: string | null
          weekly_newsletter?: boolean | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          display_name: string | null
          email_breaking_news: boolean | null
          email_daily_digest: boolean | null
          email_weekly_newsletter: boolean | null
          id: string
          is_verified: boolean | null
          primary_neighborhood_id: string | null
          reputation_score: number | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          email_breaking_news?: boolean | null
          email_daily_digest?: boolean | null
          email_weekly_newsletter?: boolean | null
          id: string
          is_verified?: boolean | null
          primary_neighborhood_id?: string | null
          reputation_score?: number | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          email_breaking_news?: boolean | null
          email_daily_digest?: boolean | null
          email_weekly_newsletter?: boolean | null
          id?: string
          is_verified?: boolean | null
          primary_neighborhood_id?: string | null
          reputation_score?: number | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_primary_neighborhood_id_fkey"
            columns: ["primary_neighborhood_id"]
            isOneToOne: false
            referencedRelation: "neighborhoods"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_saved_items: {
        Row: {
          created_at: string | null
          id: string
          item_id: string
          item_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          item_id: string
          item_type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          item_id?: string
          item_type?: string
          user_id?: string
        }
        Relationships: []
      }
      votes: {
        Row: {
          created_at: string | null
          id: string
          user_id: string
          vote_type: number
          voteable_id: string
          voteable_type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          user_id: string
          vote_type: number
          voteable_id: string
          voteable_type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          user_id?: string
          vote_type?: number
          voteable_id?: string
          voteable_type?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
