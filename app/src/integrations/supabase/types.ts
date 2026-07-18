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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      analytics_events: {
        Row: {
          created_at: string
          event_name: string
          id: string
          path: string | null
          properties: Json | null
          session_id: string
          surface: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_name: string
          id?: string
          path?: string | null
          properties?: Json | null
          session_id: string
          surface: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_name?: string
          id?: string
          path?: string | null
          properties?: Json | null
          session_id?: string
          surface?: string
          user_id?: string | null
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          description: string | null
          id: string
          stripe_session_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          description?: string | null
          id?: string
          stripe_session_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          description?: string | null
          id?: string
          stripe_session_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_messages_read: {
        Row: {
          created_at: string | null
          id: string
          message_date: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message_date: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message_date?: string
          user_id?: string
        }
        Relationships: []
      }
      email_log: {
        Row: {
          created_at: string
          error: string | null
          id: string
          recipient: string
          status: string
          subject: string | null
          type: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          id?: string
          recipient: string
          status: string
          subject?: string | null
          type: string
        }
        Update: {
          created_at?: string
          error?: string | null
          id?: string
          recipient?: string
          status?: string
          subject?: string | null
          type?: string
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          confirmation_token: string | null
          confirmed: boolean
          confirmed_at: string | null
          created_at: string
          email: string
          followup_sent_at: string | null
          id: string
          last_sent_at: string | null
          locale: string
          send_count: number
          sign_slug: string | null
          source: string | null
          unsubscribe_token: string
          unsubscribed: boolean
          unsubscribed_at: string | null
          updated_at: string
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          confirmation_token?: string | null
          confirmed?: boolean
          confirmed_at?: string | null
          created_at?: string
          email: string
          followup_sent_at?: string | null
          id?: string
          last_sent_at?: string | null
          locale?: string
          send_count?: number
          sign_slug?: string | null
          source?: string | null
          unsubscribe_token?: string
          unsubscribed?: boolean
          unsubscribed_at?: string | null
          updated_at?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          confirmation_token?: string | null
          confirmed?: boolean
          confirmed_at?: string | null
          created_at?: string
          email?: string
          followup_sent_at?: string | null
          id?: string
          last_sent_at?: string | null
          locale?: string
          send_count?: number
          sign_slug?: string | null
          source?: string | null
          unsubscribe_token?: string
          unsubscribed?: boolean
          unsubscribed_at?: string | null
          updated_at?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      oracle_anon_profile_hints: {
        Row: {
          birth_date: string | null
          birth_place: string | null
          birth_time: string | null
          claimed_at: string | null
          claimed_by: string | null
          first_name: string | null
          gender: string | null
          hit_count: number
          last_name: string | null
          locale: string | null
          raw_hints: Json | null
          session_id: string
          updated_at: string
        }
        Insert: {
          birth_date?: string | null
          birth_place?: string | null
          birth_time?: string | null
          claimed_at?: string | null
          claimed_by?: string | null
          first_name?: string | null
          gender?: string | null
          hit_count?: number
          last_name?: string | null
          locale?: string | null
          raw_hints?: Json | null
          session_id: string
          updated_at?: string
        }
        Update: {
          birth_date?: string | null
          birth_place?: string | null
          birth_time?: string | null
          claimed_at?: string | null
          claimed_by?: string | null
          first_name?: string | null
          gender?: string | null
          hit_count?: number
          last_name?: string | null
          locale?: string | null
          raw_hints?: Json | null
          session_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      oracle_conversations: {
        Row: {
          created_at: string | null
          guide: string | null
          id: string
          session_id: string | null
          title: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          guide?: string | null
          id?: string
          session_id?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          guide?: string | null
          id?: string
          session_id?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      oracle_daily_usage: {
        Row: {
          created_at: string
          id: string
          message_count: number
          session_id: string | null
          updated_at: string
          usage_date: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          message_count?: number
          session_id?: string | null
          updated_at?: string
          usage_date?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          message_count?: number
          session_id?: string | null
          updated_at?: string
          usage_date?: string
          user_id?: string | null
        }
        Relationships: []
      }
      oracle_feedback: {
        Row: {
          assistant_message: string | null
          created_at: string
          guide: string
          id: string
          rating: number
          session_id: string | null
          tags: Json | null
          text: string | null
          user_id: string | null
          user_message: string | null
        }
        Insert: {
          assistant_message?: string | null
          created_at?: string
          guide: string
          id?: string
          rating: number
          session_id?: string | null
          tags?: Json | null
          text?: string | null
          user_id?: string | null
          user_message?: string | null
        }
        Update: {
          assistant_message?: string | null
          created_at?: string
          guide?: string
          id?: string
          rating?: number
          session_id?: string | null
          tags?: Json | null
          text?: string | null
          user_id?: string | null
          user_message?: string | null
        }
        Relationships: []
      }
      oracle_ip_usage: {
        Row: {
          ip: string
          message_count: number
          updated_at: string
          usage_date: string
        }
        Insert: {
          ip: string
          message_count?: number
          updated_at?: string
          usage_date?: string
        }
        Update: {
          ip?: string
          message_count?: number
          updated_at?: string
          usage_date?: string
        }
        Relationships: []
      }
      oracle_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          role: string
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          role: string
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          role?: string
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "oracle_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "oracle_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      page_views: {
        Row: {
          city: string | null
          country: string | null
          country_code: string | null
          created_at: string
          id: string
          is_bot: boolean | null
          locale: string | null
          path: string
          referrer: string | null
          referrer_domain: string | null
          screen_height: number | null
          screen_width: number | null
          session_id: string | null
          surface: string | null
          time_on_page_ms: number | null
          title: string | null
          user_agent: string | null
          user_id: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          id?: string
          is_bot?: boolean | null
          locale?: string | null
          path: string
          referrer?: string | null
          referrer_domain?: string | null
          screen_height?: number | null
          screen_width?: number | null
          session_id?: string | null
          surface?: string | null
          time_on_page_ms?: number | null
          title?: string | null
          user_agent?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          id?: string
          is_bot?: boolean | null
          locale?: string | null
          path?: string
          referrer?: string | null
          referrer_domain?: string | null
          screen_height?: number | null
          screen_width?: number | null
          session_id?: string | null
          surface?: string | null
          time_on_page_ms?: number | null
          title?: string | null
          user_agent?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          badges: string[] | null
          birth_date: string | null
          birth_latitude: number | null
          birth_longitude: number | null
          birth_name: string | null
          birth_place: string | null
          birth_time: string | null
          created_at: string | null
          credits: number
          current_name: string | null
          first_name: string | null
          gender: string | null
          id: string
          interests: string[] | null
          is_admin: boolean | null
          knows_birth_time: boolean | null
          language: string | null
          last_name: string | null
          level: string | null
          natal_chart_computed_at: string | null
          natal_chart_json: Json | null
          oracle_tone: string | null
          referral_code: string | null
          referred_by_code: string | null
          referred_by_user_id: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_period_end: string | null
          subscription_status: string | null
          subscription_tier: string
          theme: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          badges?: string[] | null
          birth_date?: string | null
          birth_latitude?: number | null
          birth_longitude?: number | null
          birth_name?: string | null
          birth_place?: string | null
          birth_time?: string | null
          created_at?: string | null
          credits?: number
          current_name?: string | null
          first_name?: string | null
          gender?: string | null
          id?: string
          interests?: string[] | null
          is_admin?: boolean | null
          knows_birth_time?: boolean | null
          language?: string | null
          last_name?: string | null
          level?: string | null
          natal_chart_computed_at?: string | null
          natal_chart_json?: Json | null
          oracle_tone?: string | null
          referral_code?: string | null
          referred_by_code?: string | null
          referred_by_user_id?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_period_end?: string | null
          subscription_status?: string | null
          subscription_tier?: string
          theme?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          badges?: string[] | null
          birth_date?: string | null
          birth_latitude?: number | null
          birth_longitude?: number | null
          birth_name?: string | null
          birth_place?: string | null
          birth_time?: string | null
          created_at?: string | null
          credits?: number
          current_name?: string | null
          first_name?: string | null
          gender?: string | null
          id?: string
          interests?: string[] | null
          is_admin?: boolean | null
          knows_birth_time?: boolean | null
          language?: string | null
          last_name?: string | null
          level?: string | null
          natal_chart_computed_at?: string | null
          natal_chart_json?: Json | null
          oracle_tone?: string | null
          referral_code?: string | null
          referred_by_code?: string | null
          referred_by_user_id?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_period_end?: string | null
          subscription_status?: string | null
          subscription_tier?: string
          theme?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      readings: {
        Row: {
          content: string | null
          created_at: string
          email: string | null
          feedback: string | null
          feedback_at: string | null
          feedback_public: boolean
          feedback_text: string | null
          followup_sent_at: string | null
          id: string
          inputs_json: Json
          locale: string
          rating: number | null
          status: string
          stripe_session_id: string | null
          token: string
          tool_type: string
          user_id: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          email?: string | null
          feedback?: string | null
          feedback_at?: string | null
          feedback_public?: boolean
          feedback_text?: string | null
          followup_sent_at?: string | null
          id?: string
          inputs_json: Json
          locale?: string
          rating?: number | null
          status?: string
          stripe_session_id?: string | null
          token: string
          tool_type: string
          user_id?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          email?: string | null
          feedback?: string | null
          feedback_at?: string | null
          feedback_public?: boolean
          feedback_text?: string | null
          followup_sent_at?: string | null
          id?: string
          inputs_json?: Json
          locale?: string
          rating?: number | null
          status?: string
          stripe_session_id?: string | null
          token?: string
          tool_type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      sponsored_posts: {
        Row: {
          approved_at: string | null
          article_url: string
          categories: Json
          created_at: string
          ereferer_id: number | null
          front_image: string | null
          id: number
          meta_description: string | null
          meta_title: string | null
          post_content: string
          post_title: string
          published_at: string | null
          raw_payload: Json | null
          rejected_at: string | null
          reviewer_note: string | null
          slug: string
          source: string
          status: string
        }
        Insert: {
          approved_at?: string | null
          article_url: string
          categories?: Json
          created_at?: string
          ereferer_id?: number | null
          front_image?: string | null
          id?: number
          meta_description?: string | null
          meta_title?: string | null
          post_content: string
          post_title: string
          published_at?: string | null
          raw_payload?: Json | null
          rejected_at?: string | null
          reviewer_note?: string | null
          slug: string
          source?: string
          status?: string
        }
        Update: {
          approved_at?: string | null
          article_url?: string
          categories?: Json
          created_at?: string
          ereferer_id?: number | null
          front_image?: string | null
          id?: number
          meta_description?: string | null
          meta_title?: string | null
          post_content?: string
          post_title?: string
          published_at?: string | null
          raw_payload?: Json | null
          rejected_at?: string | null
          reviewer_note?: string | null
          slug?: string
          source?: string
          status?: string
        }
        Relationships: []
      }
      stripe_events: {
        Row: {
          created_at: string
          error: string | null
          id: string
          payload: Json | null
          processed: boolean | null
          stripe_event_id: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          error?: string | null
          id?: string
          payload?: Json | null
          processed?: boolean | null
          stripe_event_id: string
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error?: string | null
          id?: string
          payload?: Json | null
          processed?: boolean | null
          stripe_event_id?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          birth_date: string | null
          canceled_at: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          last_sent_month: string | null
          locale: string | null
          status: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
        }
        Insert: {
          birth_date?: string | null
          canceled_at?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id?: string
          last_sent_month?: string | null
          locale?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
        }
        Update: {
          birth_date?: string | null
          canceled_at?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          last_sent_month?: string | null
          locale?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
        }
        Relationships: []
      }
      user_attribution: {
        Row: {
          created_at: string
          first_session_id: string | null
          id: string
          landing_page: string | null
          referrer: string | null
          referrer_domain: string | null
          user_id: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          created_at?: string
          first_session_id?: string | null
          id?: string
          landing_page?: string | null
          referrer?: string | null
          referrer_domain?: string | null
          user_id: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          created_at?: string
          first_session_id?: string | null
          id?: string
          landing_page?: string | null
          referrer?: string | null
          referrer_domain?: string | null
          user_id?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      referral_lookup: {
        Row: {
          first_name: string | null
          referral_code: string | null
        }
        Insert: {
          first_name?: string | null
          referral_code?: string | null
        }
        Update: {
          first_name?: string | null
          referral_code?: string | null
        }
        Relationships: []
      }
      top_parrains: {
        Row: {
          badges: string[] | null
          first_filleul_at: string | null
          first_name: string | null
          referral_code: string | null
          total_filleuls: number | null
          validated_filleuls: number | null
        }
        Relationships: []
      }
      v_cta_funnel_daily: {
        Row: {
          cta_viewed: number | null
          d: string | null
          oracle_clicks: number | null
          paid_clicks: number | null
          tool_calculated: number | null
        }
        Relationships: []
      }
      v_funnel_daily: {
        Row: {
          checkout_starts: number | null
          clean_sessions: number | null
          d: string | null
          limit_hits: number | null
          new_subs: number | null
          oracle_users: number | null
          paid_checkouts: number | null
          signups: number | null
        }
        Relationships: []
      }
      v_public_reviews: {
        Row: {
          feedback_at: string | null
          feedback_text: string | null
          first_name: string | null
          locale: string | null
          rating: number | null
          tool_type: string | null
        }
        Insert: {
          feedback_at?: string | null
          feedback_text?: string | null
          first_name?: never
          locale?: string | null
          rating?: number | null
          tool_type?: string | null
        }
        Update: {
          feedback_at?: string | null
          feedback_text?: string | null
          first_name?: never
          locale?: string | null
          rating?: number | null
          tool_type?: string | null
        }
        Relationships: []
      }
      v_sessions_clean: {
        Row: {
          locale: string | null
          page_count: number | null
          reached_oracle_page: boolean | null
          session_id: string | null
          started_at: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_bot_stats: { Args: { p_period_days?: number }; Returns: Json }
      admin_device_breakdown:
        | { Args: { p_period_days?: number }; Returns: Json }
        | {
            Args: { p_exclude_bots?: boolean; p_period_days?: number }
            Returns: Json
          }
      admin_events_breakdown: {
        Args: { p_period_days?: number }
        Returns: {
          event_count: number
          event_name: string
          unique_sessions: number
          unique_users: number
        }[]
      }
      admin_get_conversation_messages: {
        Args: { p_conversation_id: string }
        Returns: {
          content: string
          created_at: string
          id: string
          role: string
        }[]
      }
      admin_get_conversations: {
        Args: { p_limit?: number; p_offset?: number }
        Returns: {
          created_at: string
          id: string
          message_count: number
          title: string
          updated_at: string
          user_email: string
          user_first_name: string
          user_id: string
        }[]
      }
      admin_get_credit_transactions: {
        Args: { p_limit?: number }
        Returns: {
          amount: number
          balance_after: number
          created_at: string
          description: string
          id: string
          stripe_session_id: string
          type: string
          user_email: string
          user_id: string
        }[]
      }
      admin_get_email_log: {
        Args: { p_limit?: number }
        Returns: {
          created_at: string
          error: string
          id: string
          recipient: string
          status: string
          subject: string
          type: string
        }[]
      }
      admin_get_feedbacks: {
        Args: { p_guide?: string; p_limit?: number; p_rating?: number }
        Returns: {
          assistant_message: string
          created_at: string
          guide: string
          id: string
          rating: number
          text: string
          user_email: string
          user_id: string
          user_message: string
        }[]
      }
      admin_get_kpis: { Args: { p_period_days?: number }; Returns: Json }
      admin_get_reading_reviews: {
        Args: { p_limit?: number }
        Returns: {
          created_at: string
          email: string
          feedback: string
          feedback_at: string
          feedback_public: boolean
          feedback_text: string
          rating: number
          token: string
          tool_type: string
        }[]
      }
      admin_get_stripe_events: {
        Args: { p_limit?: number }
        Returns: {
          created_at: string
          error: string
          id: string
          processed: boolean
          stripe_event_id: string
          type: string
          user_email: string
          user_id: string
        }[]
      }
      admin_get_timeseries: { Args: { p_period_days?: number }; Returns: Json }
      admin_get_top_referrers: {
        Args: { p_limit?: number }
        Returns: {
          created_at: string
          email: string
          filleuls_count: number
          first_name: string
          referral_code: string
          user_id: string
        }[]
      }
      admin_get_user_detail: { Args: { p_user_id: string }; Returns: Json }
      admin_get_users: {
        Args: { p_limit?: number; p_offset?: number; p_search?: string }
        Returns: {
          badges: string[]
          birth_date: string
          birth_place: string
          conversations_count: number
          created_at: string
          credits: number
          email: string
          filleuls_count: number
          first_name: string
          gender: string
          is_admin: boolean
          language: string
          last_activity: string
          last_name: string
          messages_count: number
          referral_code: string
          referred_by_code: string
          subscription_period_end: string
          subscription_status: string
          subscription_tier: string
          user_id: string
        }[]
      }
      admin_grant_credits: {
        Args: { p_amount: number; p_description?: string; p_user_id: string }
        Returns: Json
      }
      admin_live_visitors: {
        Args: { p_window_minutes?: number }
        Returns: Json
      }
      admin_newsletter_stats: { Args: never; Returns: Json }
      admin_pageviews_timeseries:
        | { Args: { p_period_days?: number }; Returns: Json }
        | {
            Args: { p_exclude_bots?: boolean; p_period_days?: number }
            Returns: Json
          }
      admin_recent_journeys: { Args: { p_limit?: number }; Returns: Json }
      admin_toggle_admin: { Args: { p_user_id: string }; Returns: boolean }
      admin_top_pages:
        | {
            Args: {
              p_limit?: number
              p_period_days?: number
              p_surface?: string
            }
            Returns: {
              avg_time_ms: number
              path: string
              surface: string
              unique_sessions: number
              views: number
            }[]
          }
        | {
            Args: {
              p_exclude_bots?: boolean
              p_limit?: number
              p_period_days?: number
              p_surface?: string
            }
            Returns: {
              avg_time_ms: number
              path: string
              surface: string
              unique_sessions: number
              views: number
            }[]
          }
      admin_traffic_sources:
        | { Args: { p_period_days?: number }; Returns: Json }
        | {
            Args: { p_exclude_bots?: boolean; p_period_days?: number }
            Returns: Json
          }
      bump_oracle_ip: { Args: { p_ip: string }; Returns: number }
      claim_session_pageviews: {
        Args: { p_session_id: string }
        Returns: number
      }
      consume_credit: {
        Args: { p_description?: string; p_user_id: string }
        Returns: boolean
      }
      fulfill_credit_purchase: {
        Args: {
          p_credits: number
          p_description?: string
          p_session_id: string
          p_user_id: string
        }
        Returns: boolean
      }
      generate_referral_code: { Args: never; Returns: string }
      get_my_natal_chart: { Args: never; Returns: Json }
      get_referral_stats: {
        Args: { p_user_id: string }
        Returns: {
          pending_count: number
          total_count: number
          validated_count: number
        }[]
      }
      has_unlimited_oracle: { Args: { p_user_id: string }; Returns: boolean }
      increment_oracle_usage: {
        Args: { p_session_id?: string; p_user_id?: string }
        Returns: {
          message_count: number
          unlimited: boolean
        }[]
      }
      is_bot_ua: { Args: { ua: string }; Returns: boolean }
      is_current_user_admin: { Args: never; Returns: boolean }
      newsletter_confirm: { Args: { p_token: string }; Returns: Json }
      newsletter_subscribe: {
        Args: {
          p_email: string
          p_locale?: string
          p_sign_slug?: string
          p_source?: string
          p_utm_campaign?: string
          p_utm_medium?: string
          p_utm_source?: string
        }
        Returns: Json
      }
      newsletter_unsubscribe: { Args: { p_token: string }; Returns: Json }
      save_natal_chart: { Args: { p_chart: Json }; Returns: boolean }
      track_page_metrics: {
        Args: {
          p_country_code?: string
          p_id: string
          p_time_on_page_ms?: number
        }
        Returns: undefined
      }
      update_user_badges: { Args: { p_user_id: string }; Returns: string[] }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
