// Generated from the Supabase project with `supabase gen types typescript`. Do not edit by hand.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      sectors: {
        Row: {
          id: number
          name: string
          slug: string
        }
        Insert: {
          id?: never
          name: string
          slug: string
        }
        Update: {
          id?: never
          name?: string
          slug?: string
        }
        Relationships: []
      }
      startup_financials: {
        Row: {
          annual_revenue: number | null
          as_of_date: string
          cash_balance: number | null
          cash_runway_months: number | null
          created_at: string
          created_by: string | null
          currency: string
          id: string
          monthly_burn_rate: number | null
          monthly_operating_expenses: number | null
          startup_id: string
          total_funding_received: number | null
          updated_at: string
        }
        Insert: {
          annual_revenue?: number | null
          as_of_date?: string
          cash_balance?: number | null
          cash_runway_months?: number | null
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          monthly_burn_rate?: number | null
          monthly_operating_expenses?: number | null
          startup_id: string
          total_funding_received?: number | null
          updated_at?: string
        }
        Update: {
          annual_revenue?: number | null
          as_of_date?: string
          cash_balance?: number | null
          cash_runway_months?: number | null
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          monthly_burn_rate?: number | null
          monthly_operating_expenses?: number | null
          startup_id?: string
          total_funding_received?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "startup_financials_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "startup_financials_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "startups"
            referencedColumns: ["id"]
          },
        ]
      }
      startup_members: {
        Row: {
          access: Database["public"]["Enums"]["member_access"] | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          is_founder: boolean
          linkedin_url: string | null
          role_title: string | null
          startup_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          access?: Database["public"]["Enums"]["member_access"] | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          is_founder?: boolean
          linkedin_url?: string | null
          role_title?: string | null
          startup_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          access?: Database["public"]["Enums"]["member_access"] | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          is_founder?: boolean
          linkedin_url?: string | null
          role_title?: string | null
          startup_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "startup_members_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "startups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "startup_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      startups: {
        Row: {
          city: string | null
          created_at: string
          description: string | null
          district: string | null
          domain: string | null
          dpiit_recognised: boolean
          founding_year: number | null
          id: string
          is_published: boolean
          legal_status: Database["public"]["Enums"]["legal_status"]
          name: string
          offering_type: Database["public"]["Enums"]["offering_type"] | null
          owner_id: string
          product_or_service: string | null
          registration_number: string | null
          sector_id: number | null
          stage: Database["public"]["Enums"]["startup_stage"]
          state: string
          target_customers: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string
          description?: string | null
          district?: string | null
          domain?: string | null
          dpiit_recognised?: boolean
          founding_year?: number | null
          id?: string
          is_published?: boolean
          legal_status?: Database["public"]["Enums"]["legal_status"]
          name: string
          offering_type?: Database["public"]["Enums"]["offering_type"] | null
          owner_id: string
          product_or_service?: string | null
          registration_number?: string | null
          sector_id?: number | null
          stage?: Database["public"]["Enums"]["startup_stage"]
          state?: string
          target_customers?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string
          description?: string | null
          district?: string | null
          domain?: string | null
          dpiit_recognised?: boolean
          founding_year?: number | null
          id?: string
          is_published?: boolean
          legal_status?: Database["public"]["Enums"]["legal_status"]
          name?: string
          offering_type?: Database["public"]["Enums"]["offering_type"] | null
          owner_id?: string
          product_or_service?: string | null
          registration_number?: string | null
          sector_id?: number | null
          stage?: Database["public"]["Enums"]["startup_stage"]
          state?: string
          target_customers?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "startups_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "startups_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          granted_at: string
          role: Database["public"]["Enums"]["platform_role"]
          user_id: string
        }
        Insert: {
          granted_at?: string
          role: Database["public"]["Enums"]["platform_role"]
          user_id: string
        }
        Update: {
          granted_at?: string
          role?: Database["public"]["Enums"]["platform_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      legal_status:
        | "not_registered"
        | "registration_in_progress"
        | "sole_proprietorship"
        | "partnership"
        | "llp"
        | "private_limited"
        | "public_limited"
        | "other"
      member_access: "owner" | "editor" | "viewer"
      offering_type: "product" | "service" | "both"
      platform_role: "founder" | "mentor" | "incubator_admin" | "platform_admin"
      startup_stage:
        | "ideation"
        | "validation"
        | "early_development"
        | "early_traction"
        | "scaling"
        | "established"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database["public"]

export type Tables<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Row"]
export type TablesInsert<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Insert"]
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Update"]
export type Enums<T extends keyof PublicSchema["Enums"]> = PublicSchema["Enums"][T]
