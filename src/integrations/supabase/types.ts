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
      ai_processing_logs: {
        Row: {
          article_id: string | null
          category_result: string | null
          created_at: string
          error_message: string | null
          id: string
          is_breaking_result: boolean | null
          neighborhood_result: string | null
          success: boolean | null
          summary_result: string | null
          tokens_used: number | null
        }
        Insert: {
          article_id?: string | null
          category_result?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          is_breaking_result?: boolean | null
          neighborhood_result?: string | null
          success?: boolean | null
          summary_result?: string | null
          tokens_used?: number | null
        }
        Update: {
          article_id?: string | null
          category_result?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          is_breaking_result?: boolean | null
          neighborhood_result?: string | null
          success?: boolean | null
          summary_result?: string | null
          tokens_used?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_processing_logs_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      articles: {
        Row: {
          ai_summary: string | null
          author_id: string | null
          category: string
          comment_count: number | null
          content: string | null
          content_type: string | null
          created_at: string | null
          enrichment_status: string | null
          excerpt: string | null
          external_id: string | null
          faq: Json | null
          id: string
          image_url: string | null
          is_breaking: boolean | null
          is_featured: boolean | null
          language: string | null
          local_impact: string[] | null
          neighborhood_id: string | null
          published_at: string | null
          related_incident_id: string | null
          rss_source_id: string | null
          slug: string | null
          source_name: string
          source_url: string | null
          status: string | null
          title: string
          tldr_bullets: string[] | null
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
          enrichment_status?: string | null
          excerpt?: string | null
          external_id?: string | null
          faq?: Json | null
          id?: string
          image_url?: string | null
          is_breaking?: boolean | null
          is_featured?: boolean | null
          language?: string | null
          local_impact?: string[] | null
          neighborhood_id?: string | null
          published_at?: string | null
          related_incident_id?: string | null
          rss_source_id?: string | null
          slug?: string | null
          source_name: string
          source_url?: string | null
          status?: string | null
          title: string
          tldr_bullets?: string[] | null
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
          enrichment_status?: string | null
          excerpt?: string | null
          external_id?: string | null
          faq?: Json | null
          id?: string
          image_url?: string | null
          is_breaking?: boolean | null
          is_featured?: boolean | null
          language?: string | null
          local_impact?: string[] | null
          neighborhood_id?: string | null
          published_at?: string | null
          related_incident_id?: string | null
          rss_source_id?: string | null
          slug?: string | null
          source_name?: string
          source_url?: string | null
          status?: string | null
          title?: string
          tldr_bullets?: string[] | null
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
          {
            foreignKeyName: "articles_related_incident_id_fkey"
            columns: ["related_incident_id"]
            isOneToOne: false
            referencedRelation: "crime_incidents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "articles_rss_source_id_fkey"
            columns: ["rss_source_id"]
            isOneToOne: false
            referencedRelation: "rss_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      business_categories: {
        Row: {
          description: string | null
          display_order: number | null
          icon: string | null
          id: string
          name: string
          parent_id: string | null
          slug: string
        }
        Insert: {
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          name: string
          parent_id?: string | null
          slug: string
        }
        Update: {
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "business_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          address: string | null
          amenities: string[] | null
          category: string
          city: string | null
          claimed: boolean | null
          claimed_by: string | null
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          email: string | null
          external_id: string | null
          gallery_urls: string[] | null
          hours: Json | null
          id: string
          is_featured: boolean | null
          last_synced_at: string | null
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          name: string
          neighborhood_id: string | null
          phone: string | null
          price_level: number | null
          rating: number | null
          review_count: number | null
          short_description: string | null
          slug: string
          source: string | null
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
          amenities?: string[] | null
          category: string
          city?: string | null
          claimed?: boolean | null
          claimed_by?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          external_id?: string | null
          gallery_urls?: string[] | null
          hours?: Json | null
          id?: string
          is_featured?: boolean | null
          last_synced_at?: string | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name: string
          neighborhood_id?: string | null
          phone?: string | null
          price_level?: number | null
          rating?: number | null
          review_count?: number | null
          short_description?: string | null
          slug: string
          source?: string | null
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
          amenities?: string[] | null
          category?: string
          city?: string | null
          claimed?: boolean | null
          claimed_by?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          external_id?: string | null
          gallery_urls?: string[] | null
          hours?: Json | null
          id?: string
          is_featured?: boolean | null
          last_synced_at?: string | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name?: string
          neighborhood_id?: string | null
          phone?: string | null
          price_level?: number | null
          rating?: number | null
          review_count?: number | null
          short_description?: string | null
          slug?: string
          source?: string | null
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
      city_event_imports: {
        Row: {
          error_message: string | null
          events_created: number
          events_fetched: number
          events_skipped: number
          events_updated: number
          id: string
          import_date: string
          success: boolean
        }
        Insert: {
          error_message?: string | null
          events_created?: number
          events_fetched?: number
          events_skipped?: number
          events_updated?: number
          id?: string
          import_date?: string
          success?: boolean
        }
        Update: {
          error_message?: string | null
          events_created?: number
          events_fetched?: number
          events_skipped?: number
          events_updated?: number
          id?: string
          import_date?: string
          success?: boolean
        }
        Relationships: []
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
      crime_incidents: {
        Row: {
          address: string | null
          created_at: string | null
          description: string | null
          id: string
          incident_category: string | null
          incident_number: string
          incident_type: string
          latitude: number | null
          longitude: number | null
          neighborhood_id: string | null
          occurred_at: string | null
          raw_data: Json | null
          reported_at: string | null
          source_url: string | null
          status: string | null
          updated_at: string | null
          zone: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          incident_category?: string | null
          incident_number: string
          incident_type: string
          latitude?: number | null
          longitude?: number | null
          neighborhood_id?: string | null
          occurred_at?: string | null
          raw_data?: Json | null
          reported_at?: string | null
          source_url?: string | null
          status?: string | null
          updated_at?: string | null
          zone?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          incident_category?: string | null
          incident_number?: string
          incident_type?: string
          latitude?: number | null
          longitude?: number | null
          neighborhood_id?: string | null
          occurred_at?: string | null
          raw_data?: Json | null
          reported_at?: string | null
          source_url?: string | null
          status?: string | null
          updated_at?: string | null
          zone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crime_incidents_neighborhood_id_fkey"
            columns: ["neighborhood_id"]
            isOneToOne: false
            referencedRelation: "neighborhoods"
            referencedColumns: ["id"]
          },
        ]
      }
      crime_stats_daily: {
        Row: {
          count: number
          created_at: string | null
          date: string
          id: string
          incident_type: string
          neighborhood_id: string | null
        }
        Insert: {
          count?: number
          created_at?: string | null
          date: string
          id?: string
          incident_type: string
          neighborhood_id?: string | null
        }
        Update: {
          count?: number
          created_at?: string | null
          date?: string
          id?: string
          incident_type?: string
          neighborhood_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crime_stats_daily_neighborhood_id_fkey"
            columns: ["neighborhood_id"]
            isOneToOne: false
            referencedRelation: "neighborhoods"
            referencedColumns: ["id"]
          },
        ]
      }
      data_operation_logs: {
        Row: {
          created_at: string
          details: string | null
          duration_ms: number | null
          error_message: string | null
          id: string
          metadata: Json | null
          operation_name: string
          operation_type: string
          status: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          operation_name: string
          operation_type: string
          status?: string
        }
        Update: {
          created_at?: string
          details?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          operation_name?: string
          operation_type?: string
          status?: string
        }
        Relationships: []
      }
      event_reminders: {
        Row: {
          created_at: string
          event_id: string
          id: string
          remind_at: string
          reminded: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          remind_at: string
          reminded?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          remind_at?: string
          reminded?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_reminders_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
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
          external_id: string | null
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
          external_id?: string | null
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
          external_id?: string | null
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
          boundaries: Json | null
          created_at: string | null
          description: string | null
          display_order: number | null
          established: string | null
          external_links: Json | null
          hero_image_url: string | null
          highlights: string[] | null
          id: string
          image_url: string | null
          name: string
          population: number | null
          slug: string
          thumbnail_url: string | null
          vibe: string | null
          zip_codes: string[] | null
        }
        Insert: {
          boundaries?: Json | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          established?: string | null
          external_links?: Json | null
          hero_image_url?: string | null
          highlights?: string[] | null
          id?: string
          image_url?: string | null
          name: string
          population?: number | null
          slug: string
          thumbnail_url?: string | null
          vibe?: string | null
          zip_codes?: string[] | null
        }
        Update: {
          boundaries?: Json | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          established?: string | null
          external_links?: Json | null
          hero_image_url?: string | null
          highlights?: string[] | null
          id?: string
          image_url?: string | null
          name?: string
          population?: number | null
          slug?: string
          thumbnail_url?: string | null
          vibe?: string | null
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
          source: string | null
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
          source?: string | null
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
          source?: string | null
          status?: string | null
          unsubscribed_at?: string | null
          user_id?: string | null
          verification_token?: string | null
          verified_at?: string | null
          weekly_newsletter?: boolean | null
        }
        Relationships: []
      }
      rss_sources: {
        Row: {
          articles_count: number | null
          category_default: string | null
          created_at: string | null
          feed_url: string
          fetch_frequency_minutes: number | null
          id: string
          is_active: boolean | null
          last_fetched_at: string | null
          logo_url: string | null
          name: string
          slug: string
          website_url: string | null
        }
        Insert: {
          articles_count?: number | null
          category_default?: string | null
          created_at?: string | null
          feed_url: string
          fetch_frequency_minutes?: number | null
          id?: string
          is_active?: boolean | null
          last_fetched_at?: string | null
          logo_url?: string | null
          name: string
          slug: string
          website_url?: string | null
        }
        Update: {
          articles_count?: number | null
          category_default?: string | null
          created_at?: string | null
          feed_url?: string
          fetch_frequency_minutes?: number | null
          id?: string
          is_active?: boolean | null
          last_fetched_at?: string | null
          logo_url?: string | null
          name?: string
          slug?: string
          website_url?: string | null
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
      weather_alerts: {
        Row: {
          alert_id: string
          areas: string[] | null
          created_at: string | null
          description: string | null
          effective_at: string | null
          event: string
          expires_at: string | null
          headline: string | null
          id: string
          instruction: string | null
          severity: string | null
          status: string | null
          urgency: string | null
        }
        Insert: {
          alert_id: string
          areas?: string[] | null
          created_at?: string | null
          description?: string | null
          effective_at?: string | null
          event: string
          expires_at?: string | null
          headline?: string | null
          id?: string
          instruction?: string | null
          severity?: string | null
          status?: string | null
          urgency?: string | null
        }
        Update: {
          alert_id?: string
          areas?: string[] | null
          created_at?: string | null
          description?: string | null
          effective_at?: string | null
          event?: string
          expires_at?: string | null
          headline?: string | null
          id?: string
          instruction?: string | null
          severity?: string | null
          status?: string | null
          urgency?: string | null
        }
        Relationships: []
      }
      weather_current: {
        Row: {
          conditions: string | null
          conditions_icon: string | null
          feels_like_f: number | null
          humidity: number | null
          id: string
          location: string
          temperature_c: number | null
          temperature_f: number | null
          updated_at: string | null
          wind_direction: string | null
          wind_speed: string | null
        }
        Insert: {
          conditions?: string | null
          conditions_icon?: string | null
          feels_like_f?: number | null
          humidity?: number | null
          id?: string
          location?: string
          temperature_c?: number | null
          temperature_f?: number | null
          updated_at?: string | null
          wind_direction?: string | null
          wind_speed?: string | null
        }
        Update: {
          conditions?: string | null
          conditions_icon?: string | null
          feels_like_f?: number | null
          humidity?: number | null
          id?: string
          location?: string
          temperature_c?: number | null
          temperature_f?: number | null
          updated_at?: string | null
          wind_direction?: string | null
          wind_speed?: string | null
        }
        Relationships: []
      }
      weather_forecast: {
        Row: {
          conditions: string | null
          conditions_icon: string | null
          created_at: string | null
          detailed_forecast: string | null
          forecast_date: string
          id: string
          is_daytime: boolean | null
          location: string
          period_name: string
          precipitation_chance: number | null
          temperature: number | null
          temperature_unit: string | null
        }
        Insert: {
          conditions?: string | null
          conditions_icon?: string | null
          created_at?: string | null
          detailed_forecast?: string | null
          forecast_date: string
          id?: string
          is_daytime?: boolean | null
          location?: string
          period_name: string
          precipitation_chance?: number | null
          temperature?: number | null
          temperature_unit?: string | null
        }
        Update: {
          conditions?: string | null
          conditions_icon?: string | null
          created_at?: string | null
          detailed_forecast?: string | null
          forecast_date?: string
          id?: string
          is_daytime?: boolean | null
          location?: string
          period_name?: string
          precipitation_chance?: number | null
          temperature?: number | null
          temperature_unit?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_newsletter_subscription: {
        Args: { email_addr: string }
        Returns: Json
      }
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
