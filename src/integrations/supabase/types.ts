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
      connections: {
        Row: {
          created_at: string
          id: string
          intro_message: string | null
          opportunity_id: string | null
          recipient_id: string
          requester_id: string
          responded_at: string | null
          status: Database["public"]["Enums"]["connection_status"]
        }
        Insert: {
          created_at?: string
          id?: string
          intro_message?: string | null
          opportunity_id?: string | null
          recipient_id: string
          requester_id: string
          responded_at?: string | null
          status?: Database["public"]["Enums"]["connection_status"]
        }
        Update: {
          created_at?: string
          id?: string
          intro_message?: string | null
          opportunity_id?: string | null
          recipient_id?: string
          requester_id?: string
          responded_at?: string | null
          status?: Database["public"]["Enums"]["connection_status"]
        }
        Relationships: [
          {
            foreignKeyName: "connections_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          connection_id: string | null
          created_at: string
          id: string
          last_message_at: string
          participant_a: string
          participant_b: string
        }
        Insert: {
          connection_id?: string | null
          created_at?: string
          id?: string
          last_message_at?: string
          participant_a: string
          participant_b: string
        }
        Update: {
          connection_id?: string | null
          created_at?: string
          id?: string
          last_message_at?: string
          participant_a?: string
          participant_b?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "connections"
            referencedColumns: ["id"]
          },
        ]
      }
      entrepreneur_profiles: {
        Row: {
          background_summary: string | null
          company_name: string | null
          company_stage: Database["public"]["Enums"]["company_stage"] | null
          industry_expertise: string[]
          sector_id: string | null
          seeking: Database["public"]["Enums"]["seeking_type"][]
          team_size: number | null
          traction_summary: string | null
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          background_summary?: string | null
          company_name?: string | null
          company_stage?: Database["public"]["Enums"]["company_stage"] | null
          industry_expertise?: string[]
          sector_id?: string | null
          seeking?: Database["public"]["Enums"]["seeking_type"][]
          team_size?: number | null
          traction_summary?: string | null
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          background_summary?: string | null
          company_name?: string | null
          company_stage?: Database["public"]["Enums"]["company_stage"] | null
          industry_expertise?: string[]
          sector_id?: string | null
          seeking?: Database["public"]["Enums"]["seeking_type"][]
          team_size?: number | null
          traction_summary?: string | null
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entrepreneur_profiles_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          payload: Json
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          payload?: Json
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          payload?: Json
          user_id?: string | null
        }
        Relationships: []
      }
      expert_profiles: {
        Row: {
          availability: string | null
          engagement_types_sought: string[]
          expertise_areas: string[]
          past_roles_summary: string | null
          updated_at: string
          user_id: string
          years_experience: number | null
        }
        Insert: {
          availability?: string | null
          engagement_types_sought?: string[]
          expertise_areas?: string[]
          past_roles_summary?: string | null
          updated_at?: string
          user_id: string
          years_experience?: number | null
        }
        Update: {
          availability?: string | null
          engagement_types_sought?: string[]
          expertise_areas?: string[]
          past_roles_summary?: string | null
          updated_at?: string
          user_id?: string
          years_experience?: number | null
        }
        Relationships: []
      }
      founder_details: {
        Row: {
          equity_offered: string | null
          funding_required: number | null
          funding_status: string | null
          industry: string | null
          skills_needed: string[] | null
          stage: Database["public"]["Enums"]["startup_stage"] | null
          startup_description: string | null
          startup_name: string | null
          team_size: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          equity_offered?: string | null
          funding_required?: number | null
          funding_status?: string | null
          industry?: string | null
          skills_needed?: string[] | null
          stage?: Database["public"]["Enums"]["startup_stage"] | null
          startup_description?: string | null
          startup_name?: string | null
          team_size?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          equity_offered?: string | null
          funding_required?: number | null
          funding_status?: string | null
          industry?: string | null
          skills_needed?: string[] | null
          stage?: Database["public"]["Enums"]["startup_stage"] | null
          startup_description?: string | null
          startup_name?: string | null
          team_size?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      investor_details: {
        Row: {
          investment_interests: string | null
          investment_range_max: number | null
          investment_range_min: number | null
          preferred_industries: string[] | null
          preferred_stages:
            | Database["public"]["Enums"]["startup_stage"][]
            | null
          updated_at: string
          user_id: string
        }
        Insert: {
          investment_interests?: string | null
          investment_range_max?: number | null
          investment_range_min?: number | null
          preferred_industries?: string[] | null
          preferred_stages?:
            | Database["public"]["Enums"]["startup_stage"][]
            | null
          updated_at?: string
          user_id: string
        }
        Update: {
          investment_interests?: string | null
          investment_range_max?: number | null
          investment_range_min?: number | null
          preferred_industries?: string[] | null
          preferred_stages?:
            | Database["public"]["Enums"]["startup_stage"][]
            | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      investor_profiles: {
        Row: {
          brings: string[]
          focus_summary: string | null
          geographies: string[]
          investor_type: Database["public"]["Enums"]["investor_type"] | null
          preferred_sectors: string[]
          preferred_stages: Database["public"]["Enums"]["opportunity_stage"][]
          profile_visibility: Database["public"]["Enums"]["investor_visibility"]
          ticket_max: number | null
          ticket_min: number | null
          track_record_summary: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          brings?: string[]
          focus_summary?: string | null
          geographies?: string[]
          investor_type?: Database["public"]["Enums"]["investor_type"] | null
          preferred_sectors?: string[]
          preferred_stages?: Database["public"]["Enums"]["opportunity_stage"][]
          profile_visibility?: Database["public"]["Enums"]["investor_visibility"]
          ticket_max?: number | null
          ticket_min?: number | null
          track_record_summary?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          brings?: string[]
          focus_summary?: string | null
          geographies?: string[]
          investor_type?: Database["public"]["Enums"]["investor_type"] | null
          preferred_sectors?: string[]
          preferred_stages?: Database["public"]["Enums"]["opportunity_stage"][]
          profile_visibility?: Database["public"]["Enums"]["investor_visibility"]
          ticket_max?: number | null
          ticket_min?: number | null
          track_record_summary?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          read_at: string | null
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      opportunities: {
        Row: {
          capital_band_max: number | null
          capital_band_min: number | null
          connection_request_count: number
          created_at: string
          description: string
          expires_at: string | null
          highlights: string[]
          id: string
          location_city: string | null
          location_country: string | null
          opportunity_type: Database["public"]["Enums"]["opportunity_type"]
          owner_id: string
          screening_status: Database["public"]["Enums"]["opportunity_screening"]
          sector_id: string | null
          seeking: Database["public"]["Enums"]["seeking_type"][]
          stage: Database["public"]["Enums"]["opportunity_stage"]
          status: Database["public"]["Enums"]["opportunity_status"]
          summary: string
          title: string
          updated_at: string
          view_count: number
        }
        Insert: {
          capital_band_max?: number | null
          capital_band_min?: number | null
          connection_request_count?: number
          created_at?: string
          description: string
          expires_at?: string | null
          highlights?: string[]
          id?: string
          location_city?: string | null
          location_country?: string | null
          opportunity_type: Database["public"]["Enums"]["opportunity_type"]
          owner_id: string
          screening_status?: Database["public"]["Enums"]["opportunity_screening"]
          sector_id?: string | null
          seeking?: Database["public"]["Enums"]["seeking_type"][]
          stage: Database["public"]["Enums"]["opportunity_stage"]
          status?: Database["public"]["Enums"]["opportunity_status"]
          summary: string
          title: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          capital_band_max?: number | null
          capital_band_min?: number | null
          connection_request_count?: number
          created_at?: string
          description?: string
          expires_at?: string | null
          highlights?: string[]
          id?: string
          location_city?: string | null
          location_country?: string | null
          opportunity_type?: Database["public"]["Enums"]["opportunity_type"]
          owner_id?: string
          screening_status?: Database["public"]["Enums"]["opportunity_screening"]
          sector_id?: string | null
          seeking?: Database["public"]["Enums"]["seeking_type"][]
          stage?: Database["public"]["Enums"]["opportunity_stage"]
          status?: Database["public"]["Enums"]["opportunity_status"]
          summary?: string
          title?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunity_media: {
        Row: {
          created_at: string
          id: string
          label: string | null
          opportunity_id: string
          storage_path: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          label?: string | null
          opportunity_id: string
          storage_path: string
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string | null
          opportunity_id?: string
          storage_path?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_media_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_details: {
        Row: {
          availability: Database["public"]["Enums"]["availability_type"] | null
          experience_level:
            | Database["public"]["Enums"]["experience_level"]
            | null
          industries: string[] | null
          portfolio_links: string[] | null
          skills: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          availability?: Database["public"]["Enums"]["availability_type"] | null
          experience_level?:
            | Database["public"]["Enums"]["experience_level"]
            | null
          industries?: string[] | null
          portfolio_links?: string[] | null
          skills?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          availability?: Database["public"]["Enums"]["availability_type"] | null
          experience_level?:
            | Database["public"]["Enums"]["experience_level"]
            | null
          industries?: string[] | null
          portfolio_links?: string[] | null
          skills?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          approval_status: Database["public"]["Enums"]["approval_status"]
          approved_at: string | null
          approved_by: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          email_verified: boolean
          full_name: string | null
          headline: string | null
          id: string
          is_founding_member: boolean
          last_active_at: string
          linkedin_url: string | null
          location: string | null
          location_city: string | null
          location_country: string | null
          phone_verified: boolean
          profile_completeness: number
          rejection_reason: string | null
          role: Database["public"]["Enums"]["app_role"]
          status: Database["public"]["Enums"]["user_status"]
          trust_tier: Database["public"]["Enums"]["trust_tier"]
          updated_at: string
          verification_status: Database["public"]["Enums"]["verification_status"]
        }
        Insert: {
          approval_status?: Database["public"]["Enums"]["approval_status"]
          approved_at?: string | null
          approved_by?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email_verified?: boolean
          full_name?: string | null
          headline?: string | null
          id: string
          is_founding_member?: boolean
          last_active_at?: string
          linkedin_url?: string | null
          location?: string | null
          location_city?: string | null
          location_country?: string | null
          phone_verified?: boolean
          profile_completeness?: number
          rejection_reason?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          status?: Database["public"]["Enums"]["user_status"]
          trust_tier?: Database["public"]["Enums"]["trust_tier"]
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Update: {
          approval_status?: Database["public"]["Enums"]["approval_status"]
          approved_at?: string | null
          approved_by?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email_verified?: boolean
          full_name?: string | null
          headline?: string | null
          id?: string
          is_founding_member?: boolean
          last_active_at?: string
          linkedin_url?: string | null
          location?: string | null
          location_city?: string | null
          location_country?: string | null
          phone_verified?: boolean
          profile_completeness?: number
          rejection_reason?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          status?: Database["public"]["Enums"]["user_status"]
          trust_tier?: Database["public"]["Enums"]["trust_tier"]
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          reason: string
          reporter_id: string
          resolved_at: string | null
          reviewer_id: string | null
          status: Database["public"]["Enums"]["report_status"]
          target_id: string
          target_type: Database["public"]["Enums"]["report_target"]
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          reason: string
          reporter_id: string
          resolved_at?: string | null
          reviewer_id?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          target_id: string
          target_type: Database["public"]["Enums"]["report_target"]
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          reason?: string
          reporter_id?: string
          resolved_at?: string | null
          reviewer_id?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          target_id?: string
          target_type?: Database["public"]["Enums"]["report_target"]
        }
        Relationships: []
      }
      saved_items: {
        Row: {
          created_at: string
          id: string
          item_type: Database["public"]["Enums"]["saved_item_type"]
          reference: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_type: Database["public"]["Enums"]["saved_item_type"]
          reference: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_type?: Database["public"]["Enums"]["saved_item_type"]
          reference?: string
          user_id?: string
        }
        Relationships: []
      }
      sectors: {
        Row: {
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          id: string
          name: string
          sort_order?: number
        }
        Update: {
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
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
      verifications: {
        Row: {
          created_at: string
          decided_at: string | null
          decision: Database["public"]["Enums"]["verification_status"]
          decision_notes: string | null
          evidence_path: string | null
          id: string
          method: Database["public"]["Enums"]["verification_method"]
          reviewer_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          decided_at?: string | null
          decision?: Database["public"]["Enums"]["verification_status"]
          decision_notes?: string | null
          evidence_path?: string | null
          id?: string
          method: Database["public"]["Enums"]["verification_method"]
          reviewer_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          decided_at?: string | null
          decision?: Database["public"]["Enums"]["verification_status"]
          decision_notes?: string | null
          evidence_path?: string | null
          id?: string
          method?: Database["public"]["Enums"]["verification_method"]
          reviewer_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_connection: { Args: { _connection_id: string }; Returns: string }
      get_or_create_conversation: {
        Args: { _other_user: string }
        Returns: string
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_approved: { Args: { _user_id: string }; Returns: boolean }
      recompute_profile_completeness: {
        Args: { _user_id: string }
        Returns: number
      }
    }
    Enums: {
      app_role: "founder" | "professional" | "investor" | "admin"
      approval_status: "pending" | "approved" | "rejected"
      availability_type: "full_time" | "part_time" | "contract" | "advisor"
      company_stage: "idea" | "early" | "growth" | "established"
      connection_status: "pending" | "accepted" | "declined" | "withdrawn"
      experience_level: "junior" | "mid" | "senior" | "expert"
      investor_type: "angel" | "strategic" | "company" | "operator_partner"
      investor_visibility: "public" | "on_connection"
      opportunity_screening: "clear" | "flagged" | "under_review"
      opportunity_stage: "idea" | "early" | "growth" | "established"
      opportunity_status: "draft" | "live" | "paused" | "expired" | "removed"
      opportunity_type:
        | "growth"
        | "strategic_partnership"
        | "funding_partner"
        | "expansion"
      report_status: "open" | "actioned" | "dismissed"
      report_target: "opportunity" | "user" | "message"
      saved_item_type: "opportunity" | "search"
      seeking_type: "funding_partner" | "strategic_partner" | "both"
      startup_stage: "idea" | "mvp" | "early" | "growth"
      trust_tier: "registered" | "active" | "verified"
      user_status: "active" | "suspended" | "banned"
      verification_method: "linkedin" | "document" | "manual"
      verification_status: "none" | "pending" | "verified" | "rejected"
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
      app_role: ["founder", "professional", "investor", "admin"],
      approval_status: ["pending", "approved", "rejected"],
      availability_type: ["full_time", "part_time", "contract", "advisor"],
      company_stage: ["idea", "early", "growth", "established"],
      connection_status: ["pending", "accepted", "declined", "withdrawn"],
      experience_level: ["junior", "mid", "senior", "expert"],
      investor_type: ["angel", "strategic", "company", "operator_partner"],
      investor_visibility: ["public", "on_connection"],
      opportunity_screening: ["clear", "flagged", "under_review"],
      opportunity_stage: ["idea", "early", "growth", "established"],
      opportunity_status: ["draft", "live", "paused", "expired", "removed"],
      opportunity_type: [
        "growth",
        "strategic_partnership",
        "funding_partner",
        "expansion",
      ],
      report_status: ["open", "actioned", "dismissed"],
      report_target: ["opportunity", "user", "message"],
      saved_item_type: ["opportunity", "search"],
      seeking_type: ["funding_partner", "strategic_partner", "both"],
      startup_stage: ["idea", "mvp", "early", "growth"],
      trust_tier: ["registered", "active", "verified"],
      user_status: ["active", "suspended", "banned"],
      verification_method: ["linkedin", "document", "manual"],
      verification_status: ["none", "pending", "verified", "rejected"],
    },
  },
} as const
