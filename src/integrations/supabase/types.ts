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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          category: string
          created_at: string
          description: string
          icon: string
          id: string
          is_active: boolean | null
          name: string
          points: number | null
          rarity: string | null
          requirements: Json | null
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          icon: string
          id?: string
          is_active?: boolean | null
          name: string
          points?: number | null
          rarity?: string | null
          requirements?: Json | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          icon?: string
          id?: string
          is_active?: boolean | null
          name?: string
          points?: number | null
          rarity?: string | null
          requirements?: Json | null
        }
        Relationships: []
      }
      application_rate_limits: {
        Row: {
          application_count: number
          blocked_until: string | null
          email: string | null
          first_application: string
          id: string
          ip_address: unknown
          last_application: string
        }
        Insert: {
          application_count?: number
          blocked_until?: string | null
          email?: string | null
          first_application?: string
          id?: string
          ip_address: unknown
          last_application?: string
        }
        Update: {
          application_count?: number
          blocked_until?: string | null
          email?: string | null
          first_application?: string
          id?: string
          ip_address?: unknown
          last_application?: string
        }
        Relationships: []
      }
      application_types: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          form_fields: Json
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          form_fields?: Json
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          form_fields?: Json
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      applications: {
        Row: {
          application_type_id: string
          closed: boolean
          closed_at: string | null
          closed_by: string | null
          created_at: string
          discord_name: string | null
          discord_tag: string | null
          fivem_name: string | null
          form_data: Json
          id: string
          notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          steam_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          application_type_id: string
          closed?: boolean
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          discord_name?: string | null
          discord_tag?: string | null
          fivem_name?: string | null
          form_data?: Json
          id?: string
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          steam_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          application_type_id?: string
          closed?: boolean
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          discord_name?: string | null
          discord_tag?: string | null
          fivem_name?: string | null
          form_data?: Json
          id?: string
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          steam_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_application_type_id_fkey"
            columns: ["application_type_id"]
            isOneToOne: false
            referencedRelation: "application_types"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          resource_id: string | null
          resource_type: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      canned_responses: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          message: string
          shortcut: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          message: string
          shortcut?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          message?: string
          shortcut?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      character_profiles: {
        Row: {
          age: number | null
          character_backstory: string | null
          character_description: string | null
          character_image_url: string | null
          character_name: string
          created_at: string
          id: string
          is_active: boolean | null
          occupation: string | null
          personality_traits: string[] | null
          relationships: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          age?: number | null
          character_backstory?: string | null
          character_description?: string | null
          character_image_url?: string | null
          character_name: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          occupation?: string | null
          personality_traits?: string[] | null
          relationships?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          age?: number | null
          character_backstory?: string | null
          character_description?: string | null
          character_image_url?: string | null
          character_name?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          occupation?: string | null
          personality_traits?: string[] | null
          relationships?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_ai_interactions: {
        Row: {
          ai_response: string
          confidence_score: number | null
          created_at: string
          escalated_to_human: boolean | null
          id: string
          session_id: string
          user_question: string
          was_helpful: boolean | null
        }
        Insert: {
          ai_response: string
          confidence_score?: number | null
          created_at?: string
          escalated_to_human?: boolean | null
          id?: string
          session_id: string
          user_question: string
          was_helpful?: boolean | null
        }
        Update: {
          ai_response?: string
          confidence_score?: number | null
          created_at?: string
          escalated_to_human?: boolean | null
          id?: string
          session_id?: string
          user_question?: string
          was_helpful?: boolean | null
        }
        Relationships: []
      }
      chat_analytics: {
        Row: {
          id: string
          metadata: Json | null
          metric_type: string
          metric_value: number | null
          recorded_at: string
          session_id: string
        }
        Insert: {
          id?: string
          metadata?: Json | null
          metric_type: string
          metric_value?: number | null
          recorded_at?: string
          session_id: string
        }
        Update: {
          id?: string
          metadata?: Json | null
          metric_type?: string
          metric_value?: number | null
          recorded_at?: string
          session_id?: string
        }
        Relationships: []
      }
      chat_banned_users: {
        Row: {
          banned_at: string
          banned_by: string
          created_at: string
          id: string
          ip_address: unknown | null
          reason: string | null
          user_id: string | null
          visitor_email: string | null
          visitor_name: string | null
        }
        Insert: {
          banned_at?: string
          banned_by: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          reason?: string | null
          user_id?: string | null
          visitor_email?: string | null
          visitor_name?: string | null
        }
        Update: {
          banned_at?: string
          banned_by?: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          reason?: string | null
          user_id?: string | null
          visitor_email?: string | null
          visitor_name?: string | null
        }
        Relationships: []
      }
      chat_file_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          id: string
          message_id: string | null
          sender_id: string | null
          sender_type: string
          session_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          id?: string
          message_id?: string | null
          sender_id?: string | null
          sender_type: string
          session_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number
          file_type?: string
          file_url?: string
          id?: string
          message_id?: string | null
          sender_id?: string | null
          sender_type?: string
          session_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          sender_id: string | null
          sender_name: string | null
          sender_type: string
          session_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          sender_id?: string | null
          sender_name?: string | null
          sender_type: string
          session_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          sender_id?: string | null
          sender_name?: string | null
          sender_type?: string
          session_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          assigned_to: string | null
          created_at: string
          ended_at: string | null
          id: string
          status: string
          updated_at: string
          user_id: string | null
          visitor_email: string | null
          visitor_name: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          ended_at?: string | null
          id?: string
          status?: string
          updated_at?: string
          user_id?: string | null
          visitor_email?: string | null
          visitor_name?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          ended_at?: string | null
          id?: string
          status?: string
          updated_at?: string
          user_id?: string | null
          visitor_email?: string | null
          visitor_name?: string | null
        }
        Relationships: []
      }
      chat_typing_indicators: {
        Row: {
          created_at: string
          id: string
          is_typing: boolean
          last_activity: string
          session_id: string
          user_id: string | null
          user_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_typing?: boolean
          last_activity?: string
          session_id: string
          user_id?: string | null
          user_type: string
        }
        Update: {
          created_at?: string
          id?: string
          is_typing?: boolean
          last_activity?: string
          session_id?: string
          user_id?: string | null
          user_type?: string
        }
        Relationships: []
      }
      community_vote_responses: {
        Row: {
          created_at: string
          id: string
          selected_option: string
          user_id: string
          vote_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          selected_option: string
          user_id: string
          vote_id: string
        }
        Update: {
          created_at?: string
          id?: string
          selected_option?: string
          user_id?: string
          vote_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_vote_responses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_vote_responses_vote_id_fkey"
            columns: ["vote_id"]
            isOneToOne: false
            referencedRelation: "community_votes"
            referencedColumns: ["id"]
          },
        ]
      }
      community_votes: {
        Row: {
          created_at: string
          created_by: string
          description: string
          ends_at: string
          id: string
          is_active: boolean | null
          min_participation: number | null
          options: Json
          requires_staff_approval: boolean | null
          starts_at: string
          title: string
          vote_type: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description: string
          ends_at: string
          id?: string
          is_active?: boolean | null
          min_participation?: number | null
          options: Json
          requires_staff_approval?: boolean | null
          starts_at?: string
          title: string
          vote_type: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string
          ends_at?: string
          id?: string
          is_active?: boolean | null
          min_participation?: number | null
          options?: Json
          requires_staff_approval?: boolean | null
          starts_at?: string
          title?: string
          vote_type?: string
        }
        Relationships: []
      }
      custom_sessions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          ip_address: unknown | null
          last_accessed: string
          session_token: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          ip_address?: unknown | null
          last_accessed?: string
          session_token: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: unknown | null
          last_accessed?: string
          session_token?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "custom_users"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_users: {
        Row: {
          avatar_url: string | null
          banned: boolean
          banned_at: string | null
          banned_by: string | null
          created_at: string
          discord_access_token: string | null
          discord_connected_at: string | null
          discord_discriminator: string | null
          discord_id: string | null
          discord_refresh_token: string | null
          discord_username: string | null
          email: string
          email_verified: boolean
          full_name: string | null
          id: string
          last_login: string | null
          password_hash: string
          reset_token: string | null
          reset_token_expires: string | null
          role: string
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          banned?: boolean
          banned_at?: string | null
          banned_by?: string | null
          created_at?: string
          discord_access_token?: string | null
          discord_connected_at?: string | null
          discord_discriminator?: string | null
          discord_id?: string | null
          discord_refresh_token?: string | null
          discord_username?: string | null
          email: string
          email_verified?: boolean
          full_name?: string | null
          id?: string
          last_login?: string | null
          password_hash: string
          reset_token?: string | null
          reset_token_expires?: string | null
          role?: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          banned?: boolean
          banned_at?: string | null
          banned_by?: string | null
          created_at?: string
          discord_access_token?: string | null
          discord_connected_at?: string | null
          discord_discriminator?: string | null
          discord_id?: string | null
          discord_refresh_token?: string | null
          discord_username?: string | null
          email?: string
          email_verified?: boolean
          full_name?: string | null
          id?: string
          last_login?: string | null
          password_hash?: string
          reset_token?: string | null
          reset_token_expires?: string | null
          role?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          body: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          subject: string
          template_type: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          subject: string
          template_type: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          subject?: string
          template_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_verification_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          token: string
          used: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          token: string
          used?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          token?: string
          used?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_verification_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "custom_users"
            referencedColumns: ["id"]
          },
        ]
      }
      event_participants: {
        Row: {
          character_id: string | null
          event_id: string
          id: string
          joined_at: string
          status: string | null
          user_id: string
        }
        Insert: {
          character_id?: string | null
          event_id: string
          id?: string
          joined_at?: string
          status?: string | null
          user_id: string
        }
        Update: {
          character_id?: string | null
          event_id?: string
          id?: string
          joined_at?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_participants_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "character_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_participants_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "rp_events"
            referencedColumns: ["id"]
          },
        ]
      }
      failed_login_attempts: {
        Row: {
          attempt_count: number
          blocked_until: string | null
          email: string | null
          first_attempt: string
          id: string
          ip_address: unknown
          last_attempt: string
          user_agent: string | null
        }
        Insert: {
          attempt_count?: number
          blocked_until?: string | null
          email?: string | null
          first_attempt?: string
          id?: string
          ip_address: unknown
          last_attempt?: string
          user_agent?: string | null
        }
        Update: {
          attempt_count?: number
          blocked_until?: string | null
          email?: string | null
          first_attempt?: string
          id?: string
          ip_address?: unknown
          last_attempt?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      individual_server_stats: {
        Row: {
          created_at: string
          id: string
          last_updated: string | null
          max_players: number
          ping_ms: number
          players_online: number
          queue_count: number
          recorded_at: string
          server_id: string
          server_online: boolean
          updated_at: string
          uptime_percentage: number
        }
        Insert: {
          created_at?: string
          id?: string
          last_updated?: string | null
          max_players?: number
          ping_ms?: number
          players_online?: number
          queue_count?: number
          recorded_at?: string
          server_id: string
          server_online?: boolean
          updated_at?: string
          uptime_percentage?: number
        }
        Update: {
          created_at?: string
          id?: string
          last_updated?: string | null
          max_players?: number
          ping_ms?: number
          players_online?: number
          queue_count?: number
          recorded_at?: string
          server_id?: string
          server_online?: boolean
          updated_at?: string
          uptime_percentage?: number
        }
        Relationships: [
          {
            foreignKeyName: "individual_server_stats_server_id_fkey"
            columns: ["server_id"]
            isOneToOne: false
            referencedRelation: "servers"
            referencedColumns: ["id"]
          },
        ]
      }
      laws: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          description: string
          fine_amount: number | null
          id: string
          is_active: boolean
          jail_time_minutes: number | null
          order_index: number
          severity_level: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          created_by?: string | null
          description: string
          fine_amount?: number | null
          id?: string
          is_active?: boolean
          jail_time_minutes?: number | null
          order_index?: number
          severity_level?: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string
          fine_amount?: number | null
          id?: string
          is_active?: boolean
          jail_time_minutes?: number | null
          order_index?: number
          severity_level?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      missed_chats: {
        Row: {
          created_at: string | null
          email_sent_at: string | null
          id: string
          push_sent_at: string | null
          session_id: string
          staff_notified: string[] | null
          wait_time_minutes: number
        }
        Insert: {
          created_at?: string | null
          email_sent_at?: string | null
          id?: string
          push_sent_at?: string | null
          session_id: string
          staff_notified?: string[] | null
          wait_time_minutes?: number
        }
        Update: {
          created_at?: string | null
          email_sent_at?: string | null
          id?: string
          push_sent_at?: string | null
          session_id?: string
          staff_notified?: string[] | null
          wait_time_minutes?: number
        }
        Relationships: [
          {
            foreignKeyName: "missed_chats_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      packages: {
        Row: {
          created_at: string
          created_by: string | null
          currency: string
          description: string | null
          features: Json | null
          id: string
          image_url: string | null
          interval: string
          is_active: boolean
          name: string
          order_index: number
          price_amount: number
          stripe_price_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          features?: Json | null
          id?: string
          image_url?: string | null
          interval?: string
          is_active?: boolean
          name: string
          order_index?: number
          price_amount: number
          stripe_price_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          features?: Json | null
          id?: string
          image_url?: string | null
          interval?: string
          is_active?: boolean
          name?: string
          order_index?: number
          price_amount?: number
          stripe_price_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      partners: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          discount_code: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          order_index: number
          updated_at: string
          website_url: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          discount_code?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          order_index?: number
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          discount_code?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          order_index?: number
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      password_reset_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          token: string
          used: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          token: string
          used?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          token?: string
          used?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "password_reset_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "custom_users"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          display_name: string
          id: string
          name: string
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          display_name: string
          id?: string
          name: string
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          display_name?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          banned: boolean
          banned_at: string | null
          banned_by: string | null
          created_at: string | null
          discord_access_token: string | null
          discord_connected_at: string | null
          discord_discriminator: string | null
          discord_id: string | null
          discord_refresh_token: string | null
          discord_username: string | null
          email: string | null
          full_name: string | null
          id: string
          role: string | null
          steam_id: string | null
          updated_at: string | null
          username: string | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          banned?: boolean
          banned_at?: string | null
          banned_by?: string | null
          created_at?: string | null
          discord_access_token?: string | null
          discord_connected_at?: string | null
          discord_discriminator?: string | null
          discord_id?: string | null
          discord_refresh_token?: string | null
          discord_username?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          role?: string | null
          steam_id?: string | null
          updated_at?: string | null
          username?: string | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          banned?: boolean
          banned_at?: string | null
          banned_by?: string | null
          created_at?: string | null
          discord_access_token?: string | null
          discord_connected_at?: string | null
          discord_discriminator?: string | null
          discord_id?: string | null
          discord_refresh_token?: string | null
          discord_username?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          role?: string | null
          steam_id?: string | null
          updated_at?: string | null
          username?: string | null
          website?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          created_at: string | null
          id: string
          subscription: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          subscription: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          subscription?: Json
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          created_at: string | null
          id: string
          permission_id: string
          role_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          permission_id: string
          role_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "staff_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      rp_events: {
        Row: {
          created_at: string
          created_by: string
          description: string
          duration_minutes: number | null
          event_date: string
          event_type: string
          id: string
          is_public: boolean | null
          location: string | null
          max_participants: number | null
          requirements: string | null
          rewards: string | null
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description: string
          duration_minutes?: number | null
          event_date: string
          event_type: string
          id?: string
          is_public?: boolean | null
          location?: string | null
          max_participants?: number | null
          requirements?: string | null
          rewards?: string | null
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string
          duration_minutes?: number | null
          event_date?: string
          event_type?: string
          id?: string
          is_public?: boolean | null
          location?: string | null
          max_participants?: number | null
          requirements?: string | null
          rewards?: string | null
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      rules: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          description: string
          id: string
          is_active: boolean
          order_index: number
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          is_active?: boolean
          order_index?: number
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          is_active?: boolean
          order_index?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      server_settings: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
        }
        Relationships: []
      }
      server_stats: {
        Row: {
          created_at: string
          id: string
          last_updated: string
          max_players: number
          ping_ms: number
          players_online: number
          queue_count: number
          server_online: boolean
          updated_at: string
          uptime_percentage: number
        }
        Insert: {
          created_at?: string
          id?: string
          last_updated?: string
          max_players?: number
          ping_ms?: number
          players_online?: number
          queue_count?: number
          server_online?: boolean
          updated_at?: string
          uptime_percentage?: number
        }
        Update: {
          created_at?: string
          id?: string
          last_updated?: string
          max_players?: number
          ping_ms?: number
          players_online?: number
          queue_count?: number
          server_online?: boolean
          updated_at?: string
          uptime_percentage?: number
        }
        Relationships: []
      }
      servers: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          ip_address: string
          is_active: boolean
          name: string
          port: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          ip_address: string
          is_active?: boolean
          name: string
          port?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          ip_address?: string
          is_active?: boolean
          name?: string
          port?: number
          updated_at?: string
        }
        Relationships: []
      }
      staff_roles: {
        Row: {
          color: string | null
          created_at: string
          created_by: string | null
          description: string | null
          display_name: string
          hierarchy_level: number
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_name: string
          hierarchy_level?: number
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_name?: string
          hierarchy_level?: number
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          package_id: string | null
          stripe_customer_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          package_id?: string | null
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          package_id?: string | null
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscribers_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
        ]
      }
      supporters: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          donation_date: string | null
          id: string
          is_anonymous: boolean | null
          is_featured: boolean | null
          message: string | null
          supporter_tier: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          donation_date?: string | null
          id?: string
          is_anonymous?: boolean | null
          is_featured?: boolean | null
          message?: string | null
          supporter_tier?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          donation_date?: string | null
          id?: string
          is_anonymous?: boolean | null
          is_featured?: boolean | null
          message?: string | null
          supporter_tier?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supporters_user_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          auto_synced: boolean | null
          bio: string | null
          created_at: string
          created_by: string | null
          discord_id: string | null
          discord_username: string | null
          id: string
          image_url: string | null
          is_active: boolean
          last_discord_sync: string | null
          location: string | null
          name: string
          order_index: number
          role: string
          staff_role_id: string | null
          updated_at: string
        }
        Insert: {
          auto_synced?: boolean | null
          bio?: string | null
          created_at?: string
          created_by?: string | null
          discord_id?: string | null
          discord_username?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          last_discord_sync?: string | null
          location?: string | null
          name: string
          order_index?: number
          role: string
          staff_role_id?: string | null
          updated_at?: string
        }
        Update: {
          auto_synced?: boolean | null
          bio?: string | null
          created_at?: string
          created_by?: string | null
          discord_id?: string | null
          discord_username?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          last_discord_sync?: string | null
          location?: string | null
          name?: string
          order_index?: number
          role?: string
          staff_role_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_team_members_staff_role"
            columns: ["staff_role_id"]
            isOneToOne: false
            referencedRelation: "staff_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      twitch_streamers: {
        Row: {
          avatar_url: string | null
          created_at: string
          created_by: string | null
          display_name: string | null
          id: string
          is_active: boolean
          order_index: number
          twitch_username: string
          updated_at: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          created_by?: string | null
          display_name?: string | null
          id?: string
          is_active?: boolean
          order_index?: number
          twitch_username: string
          updated_at?: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          created_by?: string | null
          display_name?: string | null
          id?: string
          is_active?: boolean
          order_index?: number
          twitch_username?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          earned_at: string
          id: string
          progress: number | null
          user_id: string
        }
        Insert: {
          achievement_id: string
          earned_at?: string
          id?: string
          progress?: number | null
          user_id: string
        }
        Update: {
          achievement_id?: string
          earned_at?: string
          id?: string
          progress?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_role_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          role_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          role_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_role_assignments_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "staff_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_role_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "custom_users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          ip_address: unknown | null
          last_activity: string
          session_token: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          ip_address?: unknown | null
          last_activity?: string
          session_token: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: unknown | null
          last_activity?: string
          session_token?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_votes: {
        Row: {
          id: string
          selected_option: string
          user_id: string
          vote_id: string
          voted_at: string
        }
        Insert: {
          id?: string
          selected_option: string
          user_id: string
          vote_id: string
          voted_at?: string
        }
        Update: {
          id?: string
          selected_option?: string
          user_id?: string
          vote_id?: string
          voted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_votes_vote_id_fkey"
            columns: ["vote_id"]
            isOneToOne: false
            referencedRelation: "community_votes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      team_members_public: {
        Row: {
          bio: string | null
          created_at: string | null
          id: string | null
          image_url: string | null
          is_active: boolean | null
          location: string | null
          name: string | null
          order_index: number | null
          role: string | null
          staff_role_id: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          id?: string | null
          image_url?: string | null
          is_active?: boolean | null
          location?: string | null
          name?: string | null
          order_index?: number | null
          role?: string | null
          staff_role_id?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          id?: string | null
          image_url?: string | null
          is_active?: boolean | null
          location?: string | null
          name?: string | null
          order_index?: number | null
          role?: string | null
          staff_role_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_team_members_staff_role"
            columns: ["staff_role_id"]
            isOneToOne: false
            referencedRelation: "staff_roles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      analytics_query_deprecated: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      calculate_supporter_tier: {
        Args: { total_amount: number }
        Returns: string
      }
      check_missed_chats: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      check_user_is_admin: {
        Args: { check_user_id?: string }
        Returns: boolean
      }
      check_user_is_staff_role: {
        Args: { check_user_id?: string }
        Returns: boolean
      }
      check_user_permission: {
        Args: { required_role?: string; user_id: string }
        Returns: boolean
      }
      get_all_permissions_for_admin: {
        Args: Record<PropertyKey, never>
        Returns: string[]
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: string
      }
      get_user_supporter_status: {
        Args: { check_user_id: string }
        Returns: {
          is_supporter: boolean
          latest_donation: string
          tier: string
          total_donated: number
        }[]
      }
      has_admin_hierarchy: {
        Args: { check_user_uuid?: string }
        Returns: boolean
      }
      has_hierarchy_level: {
        Args: { check_user_id?: string; min_level?: number }
        Returns: boolean
      }
      has_permission: {
        Args: { check_user_id?: string; permission_name?: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          check_user_uuid: string
          target_role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      has_super_admin_hierarchy: {
        Args: { check_user_uuid?: string }
        Returns: boolean
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_moderator_or_above: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_staff: {
        Args: { check_user_uuid?: string }
        Returns: boolean
      }
      log_analytics_event: {
        Args: {
          event_type: string
          metadata?: Json
          resource_id?: string
          resource_type?: string
        }
        Returns: string
      }
      upsert_push_subscription: {
        Args: { p_subscription: Json; p_user_id: string }
        Returns: undefined
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
